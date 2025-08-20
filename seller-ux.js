(function($){
  const ctx = window.FLIPPIO_SELLER_UX || {};
  const isEdit   = !!ctx.is_edit;
  const isCreateAuction = !!ctx.is_auction_create;
  const isAdmin  = !!ctx.is_admin;
  const rules    = ctx.rules || {};
  const ajaxurl  = ctx.ajaxurl;
  const debug    = !!ctx.debug;

  function log(message, data) {
    if (debug) {
      console.log('Flippio Seller UX:', message, data || '');
    }
  }

  function findForm(){
    log('Søker etter Dokan-skjema...');
    
    // Prøv flere måter å finne skjemaet på
    const selectors = [
      'form.dokan-auction-product-form',
      'form.dokan-product-edit-form', 
      'form.dokan-product-add-form',
      'form[class*="dokan"]',
      'form[action*="auction"]',
      'form[action*="product"]'
    ];
    
    for (let selector of selectors) {
      const $form = $(selector);
      if ($form.length) {
        log('Fant skjema med selector:', selector);
        return $form.first();
      }
    }
    
    // Fallback: søk etter skjema med Dokan-klasser i innholdet
    const $allForms = $('form');
    for (let i = 0; i < $allForms.length; i++) {
      const $form = $allForms.eq(i);
      const formHtml = $form.html();
      if (formHtml.includes('dokan') || formHtml.includes('auction')) {
        log('Fant skjema via innholdsanalyse');
        return $form;
      }
    }
    
    log('Fant ikke Dokan-skjema');
    return $();
  }

  function addAdvancedBox($form){
    const $advBox = $('<div class="flippio-advanced" id="flippio-advanced-box"></div>');
    const $advBtn = $('<button type="button" class="dokan-btn dokan-btn-default flippio-adv-btn">Avanserte innstillinger</button>');
    $advBtn.on('click', function(){ $advBox.slideToggle(150); });
    
    // Finn submit-knappen og plasser avansert boks før den
    const $submitRow = $form.find('input[type="submit"], button[type="submit"]').last().closest('.dokan-form-group, .dokan-form-actions, .form-group');
    if ($submitRow.length){
      $advBox.insertBefore($submitRow);
      $advBtn.insertBefore($advBox);
    } else {
      // Fallback: plasser på slutten av skjemaet
      $form.append($advBtn, $advBox);
    }
    return $advBox;
  }

  function containerFor($el){
    // Finn nærmeste fornuftige wrapper for Dokan
    return $el.closest('.dokan-form-group, .form-group, .dokan-right, .dokan-input-group, .content-half-part').length
      ? $el.closest('.dokan-form-group, .form-group, .dokan-right, .dokan-input-group, .content-half-part')
      : $el.parent();
  }

  function applyRules($form, $advBox){
    // Regler styres av "name" til input/select/textarea
    Object.keys(rules).forEach(function(name){
      const r = rules[name] || {};
      const $field = $form.find('[name="'+name+'"]');
      if (!$field.length) return;

      const $wrap = containerFor($field);

      // Create-spesifikk oppførsel
      if (!isEdit){
        if (r.hide_create) {
          $wrap.hide();
          return;
        }
        if (r.adv_create) {
          $wrap.appendTo($advBox);
          return;
        }
      }

      // Edit-spesifikk oppførsel
      if (isEdit && r.adv_edit){
        $wrap.appendTo($advBox);
        return;
      }
    });
  }

  function addHelps($form){
    function help(sel, text){
      const $f = $form.find(sel).first();
      if(!$f.length) return;
      if($f.next('.flippio-help').length) return;
      $('<div class="flippio-help"></div>').text(text).insertAfter($f);
    }
    // Generelle hjelpetekster for Dokan auksjoner
    help('input[name="post_title"]', 'Kort og tydelig tittel (f.eks. "Pikachu PSA 10 – 1st Edition").');
    help('textarea[name="post_excerpt"]', 'Kort beskrivelse – mer kan legges til under Rediger.');
    help('input[name="_auction_start_price"]', 'Startpris for bud.');
    help('input[name="_auction_bid_increment"]', 'Økning mellom bud (kr).');
    help('input[name="_regular_price"]', 'Valgfritt: "Kjøp nå" hopper over auksjonen.');
    help('input[name="_auction_dates_from"]', 'Startdato/-tid for auksjon.');
    help('input[name="_auction_dates_to"]', 'Sluttdato/-tid. Tips: kveldstid gir flere bud.');
    help('select[name="_auction_item_condition"]', 'Velg om produktet er nytt eller brukt.');
    help('select[name="_auction_type"]', 'Normal auksjon eller reverse auksjon.');
  }

  function addAdminScanButton($form){
    if (!isAdmin) return;
    
    const $btn = $('<button type="button" class="dokan-btn dokan-btn-default flippio-scan-btn" style="margin:8px 0;">🔍 Skann felter (admin)</button>');
    $btn.on('click', function(){
      log('Skanne-knapp klikket');
      const data = scanFields($form);
      
      if (Object.keys(data).length === 0) {
        alert('❌ Ingen felter funnet. Sjekk at du er på riktig side.');
        return;
      }
      
      log('Skannet felter:', data);
      
      $.post(ajaxurl, { action: 'flippio_store_fields', fields: JSON.stringify(data) }, function(resp){
        if (resp.success) {
          alert('✅ Skannet og lagret ' + Object.keys(data).length + ' felter.\n\nGå til Innstillinger → Flippio Seller UX for å konfigurere regler.');
        } else {
          alert('❌ Feil ved lagring av felter: ' + (resp.data || 'Ukjent feil'));
        }
      }).fail(function(xhr, status, error) {
        alert('❌ AJAX-feil: ' + error);
        log('AJAX error:', xhr, status, error);
      });
    });
    
    // Plasser knappen øverst i skjemaet
    const $firstGroup = $form.find('.dokan-form-group, .form-group').first();
    if ($firstGroup.length) {
      $btn.insertBefore($firstGroup);
    } else {
      $form.prepend($btn);
    }
    
    log('Skanne-knapp lagt til');
  }

  function scanFields($form){
    const map = {};
    log('Starter felt-skanning...');
    
    $form.find('input, select, textarea').each(function(){
      const el = this;
      const name = el.name || '';
      if(!name) return;
      
      const $el = $(el);
      let label = '';
      
      // Prøv å finne label via for-attributt
      if (el.id){
        const $lbl = $form.find('label[for="'+el.id+'"]').first();
        if ($lbl.length) label = $lbl.text().trim();
      }
      
      // Fallback: finn label i nærmeste container
      if (!label){
        const $container = $el.closest('.dokan-form-group, .form-group, .content-half-part');
        if ($container.length) {
          const $label = $container.find('label').first();
          if ($label.length) label = $label.text().trim();
        }
      }
      
      // Fallback: bruk placeholder eller name
      if (!label) {
        label = el.placeholder || name;
      }
      
      map[name] = { 
        type: el.tagName.toLowerCase(), 
        label: label,
        id: el.id || '',
        placeholder: el.placeholder || ''
      };
    });
    
    log('Felt-skanning fullført. Fant ' + Object.keys(map).length + ' felter');
    return map;
  }

  function addDebugInfo($form) {
    if (!debug) return;
    
    const $debug = $('<div class="flippio-debug"></div>');
    $debug.html(`
      <strong>Flippio Seller UX Debug Info:</strong><br>
      - Plugin URL: ${ctx.plugin_url || 'N/A'}<br>
      - Is Edit: ${isEdit}<br>
      - Is Create Auction: ${isCreateAuction}<br>
      - Is Admin: ${isAdmin}<br>
      - Rules count: ${Object.keys(rules).length}<br>
      - Form class: ${$form.attr('class') || 'N/A'}<br>
      - Form action: ${$form.attr('action') || 'N/A'}
    `);
    
    $form.prepend($debug);
  }

  $(function(){
    log('Initialiserer...');
    
    // Vent litt for å la siden laste ferdig
    setTimeout(function() {
      const $form = findForm();
      if (!$form.length) {
        log('Fant ikke Dokan-skjema');
        return;
      }
      
      log('Fant skjema:', $form.attr('class'));

      const $advBox = addAdvancedBox($form);
      addAdminScanButton($form);
      addDebugInfo($form);

      // Enkel validering på create (kan utvides)
      if (isCreateAuction){
        $form.on('submit', function(){
          const required = [
            'input[name="post_title"]',
            'input[name="_auction_start_price"]',
            'input[name="_auction_bid_increment"]',
            'input[name="_auction_dates_to"]'
          ];
          for (let sel of required){
            const $f = $form.find(sel);
            if ($f.length && !$f.val()){
              $f.focus();
              alert('Fyll ut påkrevde felter før du lagrer.');
              return false;
            }
          }
        });
      }

      // Hjelpetekster
      addHelps($form);
      // Anvend regler (skjul/flytt)
      applyRules($form, $advBox);
      
      log('Initialisering fullført');
    }, 1000); // Vent 1 sekund
  });
})(jQuery);
