(function($){
  const ctx = window.FLIPPIO_SELLER_UX || {};
  const isEdit   = !!ctx.is_edit;
  const isCreateAuction = !!ctx.is_auction_create;
  const isAdmin  = !!ctx.is_admin;
  const rules    = ctx.rules || {};
  const ajaxurl  = ctx.ajaxurl;

  function findForm(){
    // Dokan add/edit product forms
    const $form = $('form.dokan-product-edit-form, form.dokan-product-add-form');
    return $form.length ? $form.first() : $();
  }

  function addAdvancedBox($form){
    const $advBox = $('<div class="flippio-advanced" id="flippio-advanced-box"></div>');
    const $advBtn = $('<button type="button" class="dokan-btn dokan-btn-default flippio-adv-btn">Avanserte innstillinger</button>');
    $advBtn.on('click', function(){ $advBox.slideToggle(150); });
    const $submitRow = $form.find('input[type="submit"], button[type="submit"]').last().closest('.dokan-form-group, .dokan-form-actions, .form-group');
    if ($submitRow.length){
      $advBox.insertBefore($submitRow);
      $advBtn.insertBefore($advBox);
    } else {
      $form.append($advBtn, $advBox);
    }
    return $advBox;
  }

  function containerFor($el){
    // Finn nærmeste fornuftige wrapper
    return $el.closest('.dokan-form-group, .form-group, .dokan-right, .dokan-input-group').length
      ? $el.closest('.dokan-form-group, .form-group, .dokan-right, .dokan-input-group')
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
    // Generelle hjelpetekster – kan utvides
    help('input[name="post_title"]', 'Kort og tydelig tittel (f.eks. "Pikachu PSA 10 – 1st Edition").');
    help('textarea[name="post_excerpt"]', 'Kort beskrivelse – mer kan legges til under Rediger.');
    help('input[name="_auction_start_price"]', 'Startpris for bud.');
    help('input[name="_auction_bid_increment"]', 'Økning mellom bud (kr).');
    help('input[name="_auction_buy_now_price"]', 'Valgfritt: "Kjøp nå" hopper over auksjonen.');
    help('input[name="_auction_dates_from"]', 'Startdato/-tid for auksjon.');
    help('input[name="_auction_dates_to"]', 'Sluttdato/-tid. Tips: kveldstid gir flere bud.');
  }

  function addAdminScanButton($form){
    if (!isAdmin) return;
    const $btn = $('<button type="button" class="dokan-btn dokan-btn-default" style="margin:8px 0;">Skann felter (admin)</button>');
    $btn.on('click', function(){
      const data = scanFields($form);
      $.post(ajaxurl, { action: 'flippio_store_fields', fields: JSON.stringify(data) }, function(resp){
        alert('Skannet og lagret ' + Object.keys(data).length + ' felter. Åpne Innstillinger → Flippio Seller UX for å huke av regler.');
      });
    });
    $form.prepend($btn);
  }

  function scanFields($form){
    const map = {};
    $form.find('input, select, textarea').each(function(){
      const el = this;
      const name = el.name || '';
      if(!name) return;
      const $el = $(el);
      let label = '';
      if (el.id){
        const $lbl = $form.find('label[for="'+el.id+'"]').first();
        if ($lbl.length) label = $lbl.text().trim();
      }
      if (!label){
        label = $el.closest('.dokan-form-group, .form-group').find('label').first().text().trim();
      }
      map[name] = { type: el.tagName.toLowerCase(), label: label };
    });
    return map;
  }

  $(function(){
    const $form = findForm();
    if (!$form.length) return;

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
            return false;
          }
        }
      });
    }

    // Hjelpetekster
    addHelps($form);
    // Anvend regler (skjul/flytt)
    applyRules($form, $advBox);
  });
})(jQuery);
