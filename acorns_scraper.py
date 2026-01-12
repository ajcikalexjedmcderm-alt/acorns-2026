import time
import json
import schedule
import os
import sys
import random
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 配置部分
URL = "https://bestinslot.xyz/brc2.0/acorns?mode=clob"
DATA_FILE = "acorns_data.json"
CHECK_INTERVAL_MINUTES = 10

def get_holders_count():
    """
    启动无头浏览器抓取 Holders 数据
    """
    print(f"[{datetime.now()}] 正在启动浏览器抓取...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式，不显示界面
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage") # 解决云端内存不足问题
    # 模拟真实浏览器 User-Agent
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=chrome_options)
    holders_count = None
    
    try:
        driver.get(URL)
        
        # 显式等待：等待至少一个 span 元素加载出来
        wait = WebDriverWait(driver, 30)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "span")))
        
        time.sleep(5) # 缓冲
        
        print("页面加载完成，开始匹配...")

        # 核心定位逻辑
        candidates = driver.find_elements(By.XPATH, "//div[contains(@class, 'font-semibold')]/span")
        
        found_val = None
        
        for span in candidates:
            text = span.text.strip()
            clean_text = text.replace(',', '')
            
            if clean_text.isdigit():
                val = int(clean_text)
                print(f"发现数字候选: {text}")
                
                if val > 100: 
                    found_val = val
                    try:
                        parent_text = span.find_element(By.XPATH, "./../..").text
                        if "Holder" in parent_text:
                            found_val = val
                            break 
                    except:
                        pass
                    if found_val: 
                         break

        if found_val is not None:
            holders_count = found_val
            print(f"🎉 成功提取 Holders: {holders_count}")
        else:
            print("⚠️ 未找到符合格式的数字。")

    except Exception as e:
        print(f"抓取过程出错: {e}")
    finally:
        driver.quit()
        
    return holders_count

def save_data(holders):
    if holders is None:
        return

    entry = {
        "timestamp": int(time.time() * 1000),
        "holders": holders,
        "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    data = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            pass

    data.append(entry)
    if len(data) > 10000:
        data = data[-10000:]

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"数据已保存至 {DATA_FILE}")

def job():
    count = get_holders_count()
    if count:
        save_data(count)

if __name__ == "__main__":
    # 检测是否在 GitHub Actions 环境中运行
    is_github_action = os.getenv("GITHUB_ACTIONS") == "true"
    
    if is_github_action:
        print("检测到云端环境 (GitHub Actions)，执行单次任务...")
        job()
        print("任务完成，退出。")
        sys.exit(0) # 正常退出，不进行循环
    else:
        # 本地模式：保持循环
        print(f"检测到本地环境，启动循环监控 (PID: {os.getpid()})")
        print(f"频率: 每 {CHECK_INTERVAL_MINUTES} 分钟")
        
        # 立即运行一次
        job()
        
        schedule.every(CHECK_INTERVAL_MINUTES).minutes.do(job)
        
        while True:
            schedule.run_pending()
            time.sleep(1)
