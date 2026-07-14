import os
import re

cwd = os.getcwd()
index_path = os.path.join(cwd, 'index.html')

with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Extract sections before replacing links (so we can put them in the new pages)
about_match = re.search(r'(<section class="section about".*?</section>)', html, re.DOTALL)
services_match = re.search(r'(<section class="section" id="services".*?</section>)', html, re.DOTALL)
exams_match = re.search(r'(<section class="section exams".*?</section>)', html, re.DOTALL)
hours_match = re.search(r'(<section class="section hours".*?</section>)', html, re.DOTALL)
contact_match = re.search(r'(<section class="section contact".*?</section>)', html, re.DOTALL)
reviews_match = re.search(r'(<section class="section reviews".*?</section>)', html, re.DOTALL)

# Update nav links in index.html to make it a multipage architecture
new_html = html
new_html = new_html.replace('href="#about"', 'href="about.html"')
new_html = new_html.replace('href="index.html#about"', 'href="about.html"')

new_html = new_html.replace('href="#services"', 'href="services.html"')
new_html = new_html.replace('href="index.html#services"', 'href="services.html"')

new_html = new_html.replace('href="#exams"', 'href="exams.html"')
new_html = new_html.replace('href="index.html#exams"', 'href="exams.html"')

new_html = new_html.replace('href="#hours"', 'href="contact.html#hours"')
new_html = new_html.replace('href="index.html#hours"', 'href="contact.html#hours"')

new_html = new_html.replace('href="#contact"', 'href="contact.html"')
new_html = new_html.replace('href="index.html#contact"', 'href="contact.html"')

new_html = new_html.replace('href="#reviews"', 'href="reviews.html"')
new_html = new_html.replace('href="index.html#reviews"', 'href="reviews.html"')

# Save the updated index.html
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

# Now build the header and footer parts
header_split = new_html.split('<main>')
if len(header_split) < 2:
    header_split = new_html.split('<main id="top">')

header_part = header_split[0] + '<main>\n'
footer_part = '\n</main>' + new_html.split('</main>')[1]

def create_page(filename, title, content_html):
    # Add a nice header for the standalone page
    page_head = f'''
<section class="service-head">
  <div class="shell">
    <div class="breadcrumb"><a href="index.html">Αρχική</a><span>/</span><span>{title}</span></div>
    <div class="eyebrow">Αναλυτική Σελίδα</div>
    <h1>{title}</h1>
  </div>
</section>
'''
    full = header_part + page_head + content_html + footer_part
    
    # Update title
    full = re.sub(
        r'<title>.*?</title>',
        f'<title>{title} - Μιλτιάδης Κουμπλής | Μαιευτήρας</title>',
        full
    )

    # Per-page canonical + og:url (so rebuilds keep correct SEO)
    canonical = "https://www.gynaiologos-koumplis.com/" + filename
    full = re.sub(r'(<link rel="canonical" href=")[^"]*(")', r'\g<1>' + canonical + r'\2', full)
    full = re.sub(r'(<meta property="og:url" content=")[^"]*(")', r'\g<1>' + canonical + r'\2', full)
    
    # Ensure CSS injection exists
    css = """
<style>
  .service-head{padding:132px 0 58px;background:linear-gradient(135deg,var(--cream),var(--paper));}
  .breadcrumb{display:flex;gap:9px;align-items:center;font-size:13px;color:var(--muted);margin-bottom:24px;flex-wrap:wrap}
  .breadcrumb a{color:var(--accent);font-weight:600}
  .service-head h1{max-width:880px}
</style>
"""
    if '.service-head{' not in full:
        full = full.replace('</head>', css + '</head>')
        
    with open(os.path.join(cwd, filename), 'w', encoding='utf-8') as f:
        f.write(full)

if about_match:
    create_page('about.html', 'Ο Ιατρός', about_match.group(1))
if services_match:
    create_page('services.html', 'Υπηρεσίες', services_match.group(1))
if exams_match:
    create_page('exams.html', 'Εξετάσεις', exams_match.group(1))
if hours_match and contact_match:
    create_page('contact.html', 'Επικοινωνία & Ωράριο', hours_match.group(1) + contact_match.group(1))
if reviews_match:
    create_page('reviews.html', 'Κριτικές', reviews_match.group(1))

print("Multipage structure created.")
