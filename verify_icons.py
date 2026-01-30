from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to /projects...")
        try:
            page.goto("http://localhost:3000/projects", timeout=10000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            page.reload()

        print("Waiting for Add Project button...")
        try:
            page.wait_for_selector('text="Add Project"', timeout=5000)
        except:
            print("Add Project button not found or timeout.")
            page.screenshot(path="/home/jules/verification/debug_projects.png")
            browser.close()
            return

        print("Clicking Add Project...")
        page.get_by_text("Add Project").first.click()

        print("Filling project name...")
        page.fill('input[placeholder="Project Name"]', "Test Project 2")

        print("Clicking Create...")
        page.get_by_role("button", name="Create").click()

        print("Waiting for project link...")
        project_link = page.get_by_role("link").filter(has_text="Test Project 2").first
        project_link.wait_for(state="visible")

        print("Clicking project...")
        project_link.click()

        print("Waiting for editor (Library button)...")
        try:
            # Wait for Library button which is unique to editor sidebar
            page.wait_for_selector('text="Library"', timeout=20000)
        except:
            print("Library button not found. Screenshotting.")
            page.screenshot(path="/home/jules/verification/debug_editor_fail.png")
            browser.close()
            return

        time.sleep(5) # Wait for render

        print("Taking screenshot...")
        page.screenshot(path="/home/jules/verification/editor_icons_final.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run()
