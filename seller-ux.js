(function($){
  const ctx = window.FLIPPIO_SELLER_UX || {};
  const isEdit   = !!ctx.is_edit;
  const isCreateAuction = !!ctx.is_auction_create;
  const isAdmin  = !!ctx.is_admin;
  const rules    = ctx.rules || {};
  const ajaxurl  = ctx.ajaxurl;

  function findForm(){
    // Dokan add/edit product forms - oppdatert for å finne riktig skjema
    const $form = $('form.dokan-auction-product-form, form.dokan-product-edit-form, form.dokan-product-add-form');
    if (!$form.length) {
      // Fallback: søk etter skjema med Dokan-klasser
      const $dokanForm = $('form[class*="dokan"]');
      if ($dokanForm.length) {
        console.log('Flippio Seller UX: Fant Dokan-skjema via fallback');
        return $dokanForm.first();
      }
    }
    return $form.length ? $form.first() : $();
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
    const $btn = $('<button type="button" class="dokan-btn dokan-btn-default" style="margin:8px 0; background: #0073aa; color: white;">🔍 Skann felter (admin)</button>');
    $btn.on('click', function(){
      const data = scanFields($form);
      console.log('Flippio Seller UX: Skannet felter:', data);
      
      $.post(ajaxurl, { action: 'flippio_store_fields', fields: JSON.stringify(data) }, function(resp){
        if (resp.success) {
          alert('✅ Skannet og lagret ' + Object.keys(data).length + ' felter.\n\nGå til Innstillinger → Flippio Seller UX for å konfigurere regler.');
        } else {
          alert('❌ Feil ved lagring av felter: ' + (resp.data || 'Ukjent feil'));
        }
      }).fail(function(xhr, status, error) {
        alert('❌ AJAX-feil: ' + error);
        console.error('Flippio Seller UX AJAX error:', xhr, status, error);
      });
    });
    
    // Plasser knappen øverst i skjemaet
    const $firstGroup = $form.find('.dokan-form-group').first();
    if ($firstGroup.length) {
      $btn.insertBefore($firstGroup);
    } else {
      $form.prepend($btn);
    }
  }

  function scanFields($form){
    const map = {};
    console.log('Flippio Seller UX: Starter felt-skanning...');
    
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
    
    console.log('Flippio Seller UX: Felt-skanning fullført. Fant ' + Object.keys(map).length + ' felter.');
    return map;
  }

  $(function(){
    console.log('Flippio Seller UX: Initialiserer...');
    
    const $form = findForm();
    if (!$form.length) {
      console.log('Flippio Seller UX: Fant ikke Dokan-skjema');
      return;
    }
    
    console.log('Flippio Seller UX: Fant skjema:', $form.attr('class'));

    const $advBox = addAdvancedBox($form);
    addAdminScanButton($form);

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
    
    console.log('Flippio Seller UX: Initialisering fullført');
  });
})(jQuery);
