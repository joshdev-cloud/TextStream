import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import os
import re

# We will fetch 4 papers related to Biology, Quantum Physics, or Cognitive Science
SEARCH_QUERY = "all:biology+OR+all:quantum+physics+OR+all:cognitive+science"
MAX_RESULTS = 4
API_URL = f"http://export.arxiv.org/api/query?search_query={SEARCH_QUERY}&start=0&max_results={MAX_RESULTS}"

DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")

def sanitize_filename(name):
    # Remove invalid characters for Windows filenames
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace("\n", " ").strip()
    # Truncate if too long
    return name[:150]

def download_papers():
    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)

    print(f"Fetching metadata from arXiv API: {API_URL}")
    try:
        response = urllib.request.urlopen(API_URL)
        xml_data = response.read()
    except Exception as e:
        print(f"Failed to fetch from arXiv API: {e}")
        return

    root = ET.fromstring(xml_data)
    
    # arXiv XML namespace
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall("atom:entry", ns)
    print(f"Found {len(entries)} papers.")

    for i, entry in enumerate(entries):
        title = entry.find("atom:title", ns).text.strip()
        
        pdf_url = None
        for link in entry.findall("atom:link", ns):
            if link.attrib.get("title") == "pdf":
                pdf_url = link.attrib.get("href")
                break
        
        if not pdf_url:
            print(f"[{i+1}/{len(entries)}] No PDF link for: {title}")
            continue

        # arXiv PDF URLs usually don't have .pdf at the end, so we append it if needed
        if not pdf_url.endswith(".pdf"):
            pdf_url += ".pdf"
            
        filename = sanitize_filename(title) + ".pdf"
        filepath = os.path.join(DOCS_DIR, filename)

        print(f"[{i+1}/{len(entries)}] Downloading: {title}")
        print(f" -> URL: {pdf_url}")
        
        try:
            # Add a generic user agent just in case
            req = urllib.request.Request(pdf_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response_pdf, open(filepath, 'wb') as out_file:
                data = response_pdf.read()
                out_file.write(data)
            print(f" -> Saved to: {filepath}")
        except Exception as e:
            print(f" -> Failed to download: {e}")

    # Now that the files are downloaded, we trigger the backend's /api/sync endpoint
    # to rebuild the vector store so the new papers are available immediately.
    print("\nTriggering backend sync to update Global Vault...")
    try:
        sync_req = urllib.request.Request("http://127.0.0.1:8000/api/sync", method="POST")
        with urllib.request.urlopen(sync_req) as sync_res:
            res_data = sync_res.read().decode('utf-8')
            print(f"Sync complete! Response: {res_data}")
    except Exception as e:
        print(f"Failed to trigger sync: {e}")
        print("Note: If the backend isn't running on port 8000, please start it or manually upload.")

if __name__ == "__main__":
    download_papers()
