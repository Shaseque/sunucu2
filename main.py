#!/usr/bin/env python3
import subprocess
import time
import psutil
import os
import requests
import json
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LowRAMWebController:
    def __init__(self, max_memory_mb=400):
        self.max_memory_mb = max_memory_mb
        self.driver = None
        self.firefox_process = None
        
    def install_geckodriver(self):
        """Geckodriver'ı otomatik olarak indir ve kur"""
        try:
            geckodriver_path = "/tmp/geckodriver"
            if os.path.exists(geckodriver_path):
                return geckodriver_path
                
            logger.info("Geckodriver indiriliyor...")
            url = "https://github.com/mozilla/geckodriver/releases/download/v0.34.0/geckodriver-v0.34.0-linux64.tar.gz"
            
            # İndir
            response = requests.get(url, timeout=30)
            with open("/tmp/geckodriver.tar.gz", "wb") as f:
                f.write(response.content)
            
            # Çıkar
            subprocess.run(["tar", "-xzf", "/tmp/geckodriver.tar.gz", "-C", "/tmp/"])
            subprocess.run(["chmod", "+x", "/tmp/geckodriver"])
            
            logger.info("Geckodriver kuruldu")
            return geckodriver_path
            
        except Exception as e:
            logger.error(f"Geckodriver kurulum hatası: {e}")
            return None
    
    def setup_firefox_options(self):
        """Firefox seçeneklerini düşük RAM için optimize et"""
        options = Options()
        
        # Headless mode - GUI gerektirmez
        options.add_argument("--headless")
        
        # Bellek ve CPU optimizasyonları
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-ipc-flooding-protection")
        
        # Medya ve görsel optimizasyonları
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=TranslateUI")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")
        
        # Bellek sınırları
        options.add_argument("--memory-pressure-off")
        options.add_argument("--max_old_space_size=256")
        
        # Firefox prefs
        options.set_preference("browser.cache.disk.enable", False)
        options.set_preference("browser.cache.memory.enable", True)
        options.set_preference("browser.cache.memory.capacity", 32768)
        options.set_preference("browser.sessionhistory.max_total_viewers", 1)
        options.set_preference("browser.sessionstore.max_tabs_undo", 1)
        options.set_preference("media.autoplay.default", 5)
        options.set_preference("image.animation_mode", "none")
        options.set_preference("dom.webnotifications.enabled", False)
        options.set_preference("geo.enabled", False)
        
        return options
    
    def start_firefox(self, url):
        """Firefox'u headless modda başlat"""
        try:
            # Geckodriver'ı kontrol et ve kur
            geckodriver_path = self.install_geckodriver()
            if not geckodriver_path:
                logger.error("Geckodriver kurulamadı")
                return False
            
            # Firefox seçeneklerini ayarla
            options = self.setup_firefox_options()
            
            # Service ayarla
            service = Service(geckodriver_path)
            
            # Firefox driver'ı başlat
            self.driver = webdriver.Firefox(
                options=options,
                service=service
            )
            
            # Timeout ayarları
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(30)
            
            # Firefox process'ini kaydet
            self.firefox_process = psutil.Process(self.driver.service.process.pid)
            
            logger.info("Firefox headless mode başlatıldı")
            
            # Web sitesine git
            self.driver.get(url)
            logger.info(f"Web sitesi açıldı: {url}")
            
            return True
            
        except Exception as e:
            logger.error(f"Firefox başlatma hatası: {e}")
            return False
    
    def monitor_memory(self):
        """Firefox'un bellek kullanımını kontrol et"""
        try:
            if self.firefox_process and self.firefox_process.is_running():
                memory_info = self.firefox_process.memory_info()
                memory_mb = memory_info.rss / 1024 / 1024
                
                logger.info(f"Firefox bellek kullanımı: {memory_mb:.2f} MB")
                
                if memory_mb > self.max_memory_mb:
                    logger.warning(f"Bellek limiti aşıldı! ({memory_mb:.2f} MB > {self.max_memory_mb} MB)")
                    return False
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            logger.error("Firefox process kontrol edilemiyor")
            return False
        except Exception as e:
            logger.error(f"Bellek kontrolü hatası: {e}")
            return False
    
    def get_page_info(self):
        """Sayfa bilgilerini al"""
        try:
            if not self.driver:
                return None
                
            info = {
                'title': self.driver.title,
                'url': self.driver.current_url,
                'page_source_length': len(self.driver.page_source),
                'status': 'active'
            }
            
            # Basit sayfa kontrolü
            body = self.driver.find_element(By.TAG_NAME, "body")
            if body:
                info['body_text_length'] = len(body.text)
            
            return info
            
        except Exception as e:
            logger.error(f"Sayfa bilgisi alma hatası: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def restart_firefox_if_needed(self, url):
        """Gerekirse Firefox'u yeniden başlat"""
        try:
            if not self.monitor_memory():
                logger.info("Firefox yeniden başlatılıyor...")
                self.close_firefox()
                time.sleep(3)
                return self.start_firefox(url)
            return True
        except Exception as e:
            logger.error(f"Yeniden başlatma hatası: {e}")
            return False
    
    def control_website(self, url, check_interval=30):
        """Web sitesini kontrol et ve bellek kullanımını izle"""
        logger.info(f"Web sitesi kontrolü başlatılıyor: {url}")
        
        # Firefox başlat
        if not self.start_firefox(url):
            logger.error("Firefox başlatılamadı")
            return False
        
        try:
            while True:
                # Sayfa bilgilerini al
                page_info = self.get_page_info()
                if page_info:
                    if page_info.get('status') == 'active':
                        logger.info(f"Sayfa aktif - Başlık: {page_info.get('title', 'N/A')}")
                        logger.info(f"Sayfa boyutu: {page_info.get('page_source_length', 0)} karakter")
                    else:
                        logger.warning(f"Sayfa hatası: {page_info.get('error', 'Bilinmeyen hata')}")
                        # Sayfayı yenile
                        self.driver.refresh()
                
                # Bellek kontrolü ve gerekirse yeniden başlatma
                if not self.restart_firefox_if_needed(url):
                    logger.error("Firefox yeniden başlatılamadı, çıkılıyor")
                    break
                
                # Belirtilen süre bekle
                logger.info(f"{check_interval} saniye bekleniyor...")
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            logger.info("Kullanıcı tarafından durduruldu (Ctrl+C)")
        except Exception as e:
            logger.error(f"Kontrol döngüsü hatası: {e}")
        finally:
            self.close_firefox()
    
    def close_firefox(self):
        """Firefox'u temizce kapat"""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                logger.info("Firefox driver kapatıldı")
            
            if self.firefox_process:
                try:
                    if self.firefox_process.is_running():
                        self.firefox_process.terminate()
                        self.firefox_process.wait(timeout=5)
                except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                    # Force kill if needed
                    try:
                        self.firefox_process.kill()
                    except:
                        pass
                self.firefox_process = None
                logger.info("Firefox process temizlendi")
                
        except Exception as e:
            logger.error(f"Firefox kapatma hatası: {e}")

# Basit HTTP kontrolü alternatifi
def simple_http_check(url, interval=30, max_requests=None):
    """Selenium olmadan basit HTTP kontrolü"""
    logger.info(f"Basit HTTP kontrolü başlatılıyor: {url}")
    
    request_count = 0
    
    try:
        while True:
            try:
                response = requests.get(url, timeout=10)
                status_code = response.status_code
                content_length = len(response.content)
                
                logger.info(f"HTTP {status_code} - İçerik boyutu: {content_length} byte")
                
                if status_code == 200:
                    logger.info("Site erişilebilir durumda")
                else:
                    logger.warning(f"Site uyarısı - HTTP {status_code}")
                    
                request_count += 1
                if max_requests and request_count >= max_requests:
                    logger.info(f"Maximum {max_requests} istek tamamlandı")
                    break
                    
            except requests.RequestException as e:
                logger.error(f"HTTP istek hatası: {e}")
            
            time.sleep(interval)
            
    except KeyboardInterrupt:
        logger.info("HTTP kontrolü durduruldu")

def main():
    print("Web Sitesi Kontrolü Seçenekleri:")
    print("1. Firefox ile tam kontrol (400MB RAM sınırı)")
    print("2. Basit HTTP kontrolü (düşük kaynak kullanımı)")
    
    choice = input("Seçiminizi yapın (1/2): ").strip()
    
    # Web sitesi URL'si
    website_url = input("Kontrol edilecek web sitesi URL'si (örn: https://www.google.com): ").strip()
    if not website_url.startswith(('http://', 'https://')):
        website_url = 'https://' + website_url
    
    # Kontrol aralığı
    try:
        check_interval = int(input("Kontrol aralığı (saniye, varsayılan 30): ") or "30")
    except ValueError:
        check_interval = 30
    
    if choice == "1":
        # Firefox kontrolü
        controller = LowRAMWebController(max_memory_mb=400)
        controller.control_website(website_url, check_interval)
    else:
        # Basit HTTP kontrolü
        simple_http_check(website_url, check_interval)

if __name__ == "__main__":
    main()