import time
import json
import os
import sys
from datetime import datetime, timedelta # 👈 引入 timedelta 用来加时间
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ================= 配置部分 =================
URL = "https://bestinslot.xyz/brc2.0/acorns?mode=clob"
DATA_FILE = "acorns_data.json"
# ===========================================

def get_beijing_time():
    """获取当前 UTC+8 (北京/新加坡) 时间对象"""
    # GitHub Action 默认是 UTC 时间，所以我们获取 UTC 后 +8 小时
    return datetime.utcnow() + timedelta(hours=8)

def get_holders_count():
    """
    启动无头浏览器抓取 Holders 数据
    """
    current_time = get_beijing_time()
    print(f"[{current_time}] 正在启动浏览器抓取...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
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
                
                # 简单的过滤逻辑：假设 holders 数量肯定大于 100
                if val > 100: 
                    found_val = val
                    try:
                        # 尝试向上查找父元素确认语义
                        parent_text = span.find_element(By.XPATH, "./../..").text
                        if "Holder" in parent_text:
                            found_val = val
                            break 
                    except:
                        pass
                    # 如果找到了看起来合理的数字，也可以先暂存
                    if found_val: 
                         break

        if found_val is not None:
            holders_count = found_val
            print(f"🎉 成功提取 Holders: {holders_count}")
        else:
            print("⚠️ 未找到符合格式的数字。")
            # 这里如果不抛出异常，save_log 会以为成功了但没数字
            raise Exception("Elements found but no valid number extracted")

    except Exception as e:
        # 这里只抛出异常，让主函数去捕获和记录
        raise e
    finally:
        driver.quit()
        
    return holders_count

def save_log(status, holders, error_msg=None):
    """
    核心保存逻辑：
    - 读取旧数据
    - 对比数据变化 (计算 Diff)
    - 写入新日志 (使用 UTC+8 时间)
    """
    data = []
    
    # 1. 读取现有数据
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            data = []

    # 2. 准备新条目 (使用 UTC+8 时间)
    bj_time = get_beijing_time()
    timestamp_str = bj_time.strftime("%H:%M") # 显示用的短时间
    full_date = bj_time.strftime("%Y-%m-%d %H:%M:%S")
    
    entry = {
        "status": status,  # "CHECK" or "ERROR"
        "holders": holders if holders else "N/A",
        "timestamp": full_date,  # 存入北京时间
        "time_display": timestamp_str,
        "message": "System Sync" # 默认消息
    }

    # 3. 如果是成功获取数据，进行对比逻辑
    if status == "CHECK" and holders:
        # 寻找上一次成功的记录进行对比
        last_holders = None
        for log in data:
            if log.get("holders") and isinstance(log["holders"], int):
                last_holders = log["holders"]
                break
        
        if last_holders:
            diff = holders - last_holders
            if diff > 0:
                entry["message"] = f"+{diff} New"
            elif diff < 0:
                entry["message"] = f"{diff} Left"
            else:
                entry["message"] = "System Sync"
    
    # 4. 如果是错误状态
    if status == "ERROR":
        entry["message"] = error_msg if error_msg else "Sync Failed"

    # 5. 插入到最前面（保证最新的在上面）
    data.insert(0, entry)
    
    # 只保留最近 500 条，防止文件过大
    if len(data) > 500:
        data = data[:500]

    # 6. 写入文件
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"日志已保存: [{status}] {entry['message']} (Time: {full_date})")

def main():
    bj_time = get_beijing_time()
    print(f"[{bj_time}] 启动任务...")
    
    try:
        # 1. 尝试抓取
        count = get_holders_count()
        
        # 2. 抓取成功，保存成功日志
        if count:
            save_log("CHECK", count)
        else:
            raise Exception("Result is None")

    except Exception as e:
        # 3. 抓取失败，保存错误日志
        print(f"❌ 任务失败: {e}")
        # 尝试读取上一次的 holders 保持数据连续性，或者存 None
        save_log("ERROR", None, error_msg=str(e)[:50]) # 限制错误信息长度
        
        # 关键：退出代码设为 1，告诉 GitHub Action 这一步出错了
        sys.exit(1)

if __name__ == "__main__":
    main()
