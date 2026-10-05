"""Local-only browser checks. No production mutations or payment requests."""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:8000'
fixture = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tests/catalog-fixture.cjs")))'], cwd=ROOT))
for asset in fixture:
    asset['image'] = 'assets/icon-192-1.png'  # deliberately recognizable test placeholder
fixture.append({'id':'shell', 'name':'Conchiglia bianca', 'type':'shell', 'image':'assets/icon-192-1.png', 'keywords':['conchiglia','mare'], 'metadata':{'color':'bianco'}, 'price_modifier':1})
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    for width in [360,390,1280]:
        context = browser.new_context(viewport={'width':width,'height':900})
        page = context.new_page()
        page.set_default_timeout(10000)
        errors=[]
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE+'/index.html')
        page.wait_for_selector('#grid .card')
        page.locator('#grid img').evaluate_all('(images)=>images.forEach(img=>img.loading="eager")')
        page.wait_for_function('document.querySelectorAll("#grid .card").length === 98')
        for category in ['Classici','Bomboniere','Portachiavi','Personalizzati','Pezzi unici','Fiocchi nascita','Braccialetti','Penne']:
            assert category in page.locator('#filters').inner_text()
        page.locator('#grid .card .add').first.click()
        assert page.locator('#cartCount').inner_text()=='1'
        page.locator('#btnCart').click()
        assert page.locator('#cartList .admin-item').count()==1
        page.locator('#btnCloseCart').click()
        page.locator('#search').fill('NOT_EXISTING_PRODUCT')
        assert page.locator('#grid .card').count()==0
        page.locator('#search').fill('')
        page.locator('#btnSettings').click()
        page.locator('#adminPass').fill('1234')
        page.locator('#btnAdminLogin').click()
        assert page.locator('#adminPanel').is_visible()
        assert page.locator('a[href="admin-configuratore.html"]').is_visible()
        page.locator('#btnCloseAdmin').click()
        page.locator('#btnCustomizer').click()
        assert page.locator('#cfgBack').is_visible()
        manual=page.frame_locator('#cfgFrame')
        manual.locator('#stageSvg circle').first.wait_for()
        manual.locator('#btnAddRing').click()
        assert manual.locator('#ringsLayer > g').count()==2
        manual.locator('#btnRingRight').click()
        assert int(manual.locator('#ringPosX').input_value())>0
        manual.locator('#btnRemoveRing').click()
        assert manual.locator('#ringsLayer > g').count()==1
        page.locator('#cfgClose').click()
        page.goto(BASE+'/configuratore-idea.html')
        page.wait_for_function('!document.getElementById("apply").disabled')
        assert 'Non sono ancora disponibili' in page.locator('#messages').inner_text()
        page.locator('#idea').fill('aggiungi una conchiglia')
        page.locator('#apply').click()
        assert page.locator('#elements > g').count()==0
        assert 'non è attualmente disponibile' in page.locator('#messages').inner_text()
        # Test catalog only; never writes tracked catalog or remote DB.
        page.evaluate('(assets)=>localStorage.setItem("ae_configurator_assets_v1",JSON.stringify(assets))',fixture)
        page.reload()
        page.wait_for_function('!document.getElementById("apply").disabled')
        page.locator('#idea').fill('un cerchio da 30 cm, due cerchi da 10 cm sotto, quattro piume rosa, due piume bianche. Scrivi Sofia al centro.')
        page.locator('#apply').click()
        assert page.locator('#elements > g').count()==9
        assert '26,00' in page.locator('#summary').inner_text()
        page.locator('#idea').fill('togli due piume rosa e aggiungi una piuma bianca')
        page.locator('#apply').click()
        assert page.locator('#elements > g').count()==8
        assert page.locator('#dedication').text_content()=='Sofia'
        page.locator('#personalText').fill('<img src=x onerror=alert(1)>')
        assert page.locator('#dedication').text_content()=='<img src=x onerror=alert(1)>'
        assert page.locator('#dedication img').count()==0
        page.locator('#elements > g').first.click()
        page.locator('#right').click()
        page.locator('#rotation').fill('30')
        page.locator('#rotation').dispatch_event('input')
        page.locator('#size').fill('1.2')
        page.locator('#size').dispatch_event('input')
        page.locator('details > summary').click()
        page.locator('#detail-significato').fill('famiglia')
        page.locator('#save').click()
        page.evaluate('window.open=(url)=>{window.__wa=url;}')
        page.locator('#whatsapp').click()
        page.locator('#whatsapp').click()
        assert page.evaluate('JSON.parse(localStorage.getItem("ae_intelligent_projects_v1")).length')==1
        assert 'wa.me/393440260906' in page.evaluate('window.__wa')
        page.locator('#idea').fill('aggiungi una conchiglia')
        page.locator('#apply').click()
        assert page.locator('#elements > g').count()==9
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        for button in page.locator('button').all():
            if button.is_visible():
                box=button.bounding_box()
                assert box['width']>0 and box['height']>=44
        # Admin create/edit/reload/deactivate; exercises same live store as customer UI.
        page.goto(BASE+'/admin-configuratore.html')
        page.locator('#password').fill('1234')
        page.locator('#loginButton').click()
        page.locator('#editor').wait_for(state='visible')
        page.locator('#newAsset').click()
        page.locator('#name').fill('Sonaglio blu')
        page.locator('#type').fill('bell')
        page.locator('#image').fill('assets/icon-192-1.png')
        page.locator('#price').fill('1.50')
        page.locator('#m-keywords').fill('sonaglio, suono')
        page.locator('#m-color').fill('blu')
        page.locator('#assetForm button[type=submit]').click()
        page.wait_for_function('document.getElementById("status").textContent === "Elemento salvato."')
        page.reload()
        page.locator('#password').fill('1234')
        page.locator('#loginButton').click()
        page.locator('#assetList button').filter(has_text='Sonaglio blu').click()
        assert page.locator('#m-keywords').input_value()=='sonaglio, suono'
        page.locator('#name').fill('Sonaglio blu aggiornato')
        page.locator('#active').uncheck()
        page.locator('#assetForm button[type=submit]').click()
        page.wait_for_function('document.getElementById("status").textContent === "Elemento salvato."')
        page.goto(BASE+'/configuratore-idea.html')
        page.wait_for_function('!document.getElementById("apply").disabled')
        page.locator('#idea').fill('aggiungi un sonaglio blu')
        page.locator('#apply').click()
        assert page.locator('#elements > g').count()==0
        assert 'non è attualmente disponibile' in page.locator('#messages').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        assert not errors, errors
        print(f'PASS {width}px: catalog, categories, search, cart, admin, original manual configurator, idea, commands, dynamic type, safe text, price, save/WhatsApp upsert, metadata CRUD, no overflow/errors')
        context.close()
    browser.close()
