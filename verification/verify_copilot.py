from playwright.sync_api import Page, expect, sync_playwright
import re
import os
import time

def test_copilot_video_access(page: Page):
    # 1. Go to homepage
    page.goto("http://localhost:3000")
    print("Loaded homepage")

    # Handle SetupModal
    # It takes time to appear
    try:
        page.wait_for_selector("text=Setup & Configuration", timeout=5000)
        print("Setup Modal appeared")

        # Select "Custom" provider to avoid needing real keys immediately,
        # or use "Anthropic" if we can mock it?
        # Let's use "Custom" and give dummy URL.
        page.select_option("select[name='llmProvider']", "custom")
        page.fill("input[name='llmBaseUrl']", "http://localhost:11434/v1") # Dummy URL
        page.fill("input[name='openaiApiKey']", "dummy-key")

        # Click Save
        page.get_by_role("button", name="Save & Continue").click()
        print("Saved settings")

    except Exception as e:
        print("Setup Modal did not appear or was already configured")

    # 2. Click "Get Started"
    try:
        get_started = page.get_by_role("button", name="Get Started")
        if get_started.count() > 0:
            get_started.click()
        else:
            page.get_by_text("Get Started").click()
        print("Clicked Get Started")
    except:
        print("Could not find Get Started button, maybe already on projects?")

    # Wait for projects page
    expect(page).to_have_url(re.compile(r"/projects"))
    print("On projects page")

    # 3. Create Project
    page.wait_for_selector("text=Add Project", timeout=10000)
    page.get_by_text("Add Project").click()
    print("Clicked Add Project")

    page.wait_for_selector("text=Create New Project")
    page.get_by_placeholder("Project Name").fill("Copilot Test Project")
    page.get_by_role("button", name="Create").click()
    print("Created project")

    # 4. Open Project
    page.wait_for_selector("text=Copilot Test Project")
    # Click the Link component containing the text
    page.locator("a").filter(has_text="Copilot Test Project").first.click()
    print("Clicked project")

    # Wait for editor
    expect(page).to_have_url(re.compile(r"/projects/"))
    print("On editor page")

    # 5. Upload Video
    # Find file input or drop zone.
    # Looking at AddButtons/UploadMedia.tsx would help, but let's guess standard hidden input.
    # Or click "Upload Media" button to trigger file picker.
    # The AddMedia component is likely in the AssetsPanel.

    # Wait for assets panel
    page.wait_for_selector("text=Media", timeout=10000)

    # Try to find file input
    # Usually hidden.
    # We can try to set input files on "input[type='file']"

    # Use the file with double spaces in name
    video_path = os.path.abspath("2020 LG OLED l  The Black 4K HDR 60fps.mp4")

    try:
        # Check if there is an input[type=file]
        page.set_input_files("input[type='file']", video_path)
        print("Uploaded video via input[type=file]")
    except Exception as e:
        print(f"Failed to upload video: {e}")
        # Maybe we need to click "Upload" first?
        # Let's try to find an upload button.
        try:
            page.get_by_text("Upload").click()
            # Then set input files
            page.set_input_files("input[type='file']", video_path)
        except:
            print("Could not find Upload button or input")

    # Wait for upload to process (file appears in list)
    # The file name is "2020 LG OLED..."
    # Should appear in MediaList
    try:
        page.wait_for_selector("text=2020 LG OLED", timeout=10000)
        print("Video appeared in Media List")
    except:
        print("Video did not appear in Media List")

    # 6. Open Copilot
    # Find Copilot button.
    # It might have an aria-label or just be an icon.
    # CopilotButton has title="AI Copilot"

    if page.locator("text=AI Copilot").count() == 0:
        print("Copilot panel not visible, trying to open")
        try:
            page.get_by_title("AI Copilot").click()
            print("Clicked Copilot button")
        except:
            print("Could not find Copilot button by title")

    # 7. Send Message
    # Once panel is open (or we assume it is open if we clicked it)
    # Wait for "Ask Copilot to edit your video..."
    try:
        page.wait_for_selector("textarea[placeholder*='Ask Copilot']", timeout=5000)
        print("Copilot input found")

        page.fill("textarea[placeholder*='Ask Copilot']", "What videos do you see in this project?")
        page.keyboard.press("Enter")
        print("Sent message to Copilot")

        # Wait for response
        # Since we use a dummy custom provider, it might error or hang.
        # But we want to see if the REQUEST includes the video info.
        # Or if the UI handles it.

        time.sleep(5)

        # Take screenshot
        page.screenshot(path="verification/copilot_interaction.png")
        print("Screenshot taken")

    except Exception as e:
        print(f"Copilot interaction failed: {e}")
        page.screenshot(path="verification/copilot_error.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_copilot_video_access(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/fatal_error.png")
            raise e
        finally:
            browser.close()
