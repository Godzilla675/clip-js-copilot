from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Assume previous script created "Test Project 2" and we are logged in/session persisted?
        # No, fresh session. Need to navigate again.

        print("Navigating to /projects...")
        try:
            page.goto("http://localhost:3000/projects", timeout=10000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            page.reload()

        # Click project if exists, or create
        print("Checking for existing project...")
        try:
            page.wait_for_selector('text="Test Project 2"', timeout=3000)
            print("Project found. Clicking...")
            page.get_by_role("link").filter(has_text="Test Project 2").first.click()
        except:
            print("Project not found. Creating...")
            page.get_by_text("Add Project").first.click()
            page.fill('input[placeholder="Project Name"]', "Test Project 3")
            page.get_by_role("button", name="Create").click()
            page.wait_for_selector('text="Test Project 3"')
            page.get_by_role("link").filter(has_text="Test Project 3").first.click()

        # Wait for editor
        page.wait_for_selector('text="Library"', timeout=15000)

        # 1. Click Library to see Media List (and Trash icon if any media)
        print("Clicking Library...")
        page.get_by_text("Library").click()
        time.sleep(1)
        page.screenshot(path="/home/jules/verification/media_list.png")

        # 2. Click Export to see Render button
        print("Clicking Export...")
        page.get_by_text("Export").click()
        time.sleep(1)
        page.screenshot(path="/home/jules/verification/export_panel.png")

        browser.close()

if __name__ == "__main__":
    run()
