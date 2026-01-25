from playwright.sync_api import sync_playwright, expect
import time
import os

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # Ensure verification dir exists
        os.makedirs("verification", exist_ok=True)

        print("Navigating to home...")
        page.goto("http://localhost:3000")
        page.screenshot(path="verification/01_home.png")

        print("Navigating to projects...")
        # Find "Get Started" link
        page.get_by_text("Get Started").click()
        page.wait_for_url("**/projects")
        page.screenshot(path="verification/02_projects.png")

        print("Creating project...")
        # Click "Add Project"
        # It's a button inside the list. Text "Add Project".
        page.get_by_text("Add Project").click()

        # Wait for modal
        page.wait_for_selector("input[placeholder='Project Name']")
        page.fill("input[placeholder='Project Name']", "Test Project")
        page.click("button:has-text('Create')")

        # Wait for project to appear in list and click it
        print("Waiting for project to appear in list...")
        page.wait_for_selector("text=Test Project")
        page.get_by_text("Test Project").first.click()

        # Wait for editor
        page.wait_for_url("**/projects/*")
        print(f"Project opened. URL: {page.url}")
        time.sleep(5) # Wait for load
        page.screenshot(path="verification/03_editor.png")

        print("Opening Copilot...")
        # Click Copilot button. It has title "AI Copilot" or text "Copilot"
        # The component code shows: <button ... title="AI Copilot"> ... <span ...>Copilot</span>
        try:
            page.get_by_title("AI Copilot").click()
        except:
            print("Title selector failed, trying text")
            page.get_by_text("Copilot").click()

        # Wait for panel
        expect(page.get_by_text("AI Copilot")).to_be_visible()
        # Wait for "Connected"
        try:
            expect(page.get_by_text("Connected")).to_be_visible(timeout=10000)
        except:
             print("Connection might be slow or failed. Taking screenshot.")
             page.screenshot(path="verification/04_copilot_connection_fail.png")
             # Proceed anyway to see if it works or if UI shows error

        page.screenshot(path="verification/04_copilot_open.png")

        # Test 1: Search Image
        print("Test 1: Search Image")
        input_area = page.get_by_placeholder("Ask Copilot to edit your video...")
        input_area.fill("Search for an image of a forest")
        page.locator("button[type='submit']").click()

        # Wait for response.
        # We wait for text "Tool 'search_images' result"
        try:
            expect(page.get_by_text("Tool 'search_images' result")).to_be_visible(timeout=30000)
        except:
            print("Timeout waiting for search results")

        time.sleep(2)
        page.screenshot(path="verification/05_search_results.png")

        # Test 2: Download
        print("Test 2: Download")
        input_area.fill("Download the first image")
        page.locator("button[type='submit']").click()

        try:
            expect(page.get_by_text("Tool 'download_asset' result")).to_be_visible(timeout=30000)
        except:
            print("Timeout waiting for download results")

        time.sleep(2)
        page.screenshot(path="verification/06_download_result.png")

        # Test 3: Add to Timeline
        print("Test 3: Add to Timeline")
        input_area.fill("Add it to the timeline")
        page.locator("button[type='submit']").click()

        # Expect failure or confusion
        time.sleep(10) # Give it time to fail or timeout
        page.screenshot(path="verification/07_add_timeline_attempt.png")

        browser.close()

if __name__ == "__main__":
    run_test()
