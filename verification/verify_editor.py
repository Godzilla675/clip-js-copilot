from playwright.sync_api import Page, expect, sync_playwright
import re

def test_editor_load(page: Page):
    # 1. Go to homepage
    page.goto("http://localhost:3000")
    print("Loaded homepage")

    # Handle SetupModal if present
    # It might take a moment to appear (fetch settings)
    page.wait_for_timeout(2000)

    # Check for "Let's get started" or similar from SetupModal
    # If it is open, we might need to close it or fill it.
    # The modal has onClose prop.
    # Let's try to find a close button if it exists.
    # Or just click "Get Started" which might trigger it.

    # 2. Click "Get Started"
    get_started = page.get_by_role("button", name="Get Started")
    if get_started.count() > 0:
        get_started.click()
    else:
        page.get_by_text("Get Started").click()
    print("Clicked Get Started")

    # If SetupModal appears, it blocks navigation.
    # We should check if we are still on homepage or if modal is visible.
    page.wait_for_timeout(1000)

    if "projects" not in page.url:
        print("Still on homepage, checking for Setup Modal")
        # Check for setup modal content.
        # Assuming we can just skip or close?
        # If SetupModal is blocking, we might need to configure LLM?
        # But wait, Home.tsx says:
        # if (!isLLMConfigured) { setShowSetup(true); return; }
        # So we MUST go through setup if not configured.
        # Can we bypass?
        # We can try to navigate directly to /projects
        page.goto("http://localhost:3000/projects")
        print("Forced navigation to /projects")

    # Wait for projects page
    expect(page).to_have_url("http://localhost:3000/projects")
    print("On projects page")

    # Wait for loading spinner to disappear
    page.wait_for_selector("text=Loading projects...", state="hidden")

    # 3. Create Project
    # Click "Add Project" button (it's inside a button inside a div)
    page.get_by_text("Add Project").click()
    print("Clicked Add Project")

    # Wait for modal
    page.wait_for_selector("text=Create New Project")

    # Fill "Project Name"
    page.get_by_placeholder("Project Name").fill("Test Project")

    # Click "Create"
    page.get_by_role("button", name="Create").click()
    print("Created project")

    # 4. Navigate to project
    # Need to find the project in the list.
    # It adds to the list.
    page.wait_for_selector("text=Test Project")
    page.get_by_text("Test Project").first.click()
    print("Clicked project")

    # 5. Verify Editor
    # Wait for editor to load.
    expect(page).to_have_url(re.compile(r"/projects/"))
    print("On editor page")

    # Wait for some editor element
    # Timeline usually has time markers or tracks.
    # TextTimeline, AudioTimeline might be empty.
    # But the layout should load.
    # Look for "Assets" or "Copilot" panels which are default.
    page.wait_for_selector("text=Export", timeout=10000)

    # Take screenshot
    page.screenshot(path="verification/editor.png")
    print("Screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_editor_load(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
