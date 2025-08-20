<?php
if (!defined('ABSPATH')) exit;
settings_errors('flippio_seller_ux');
$fields = is_array($fields) ? $fields : [];
$rules  = is_array($rules)  ? $rules  : [];
?>
<div class="wrap">
  <h1>Flippio Seller UX</h1>
  
  <div class="notice notice-info">
    <p><strong>Instruksjoner:</strong></p>
    <ol>
      <li>Gå til Dokan selger-dashboardet (produkt-redigering)</li>
      <li>Klikk på <strong>"🔍 Skann felter (admin)"</strong> knappen som vises øverst i skjemaet</li>
      <li>Kom tilbake hit og konfigurer reglene nedenfor</li>
    </ol>
  </div>

  <h2>Skannede felter (<?php echo count($fields); ?>)</h2>
  
  <?php if (!$fields): ?>
    <div class="notice notice-warning">
      <p><strong>Ingen felter er skannet enda.</strong></p>
      <p>Gå til selger-dashboardet → produkt-redigering → klikk "🔍 Skann felter (admin)" knappen.</p>
    </div>
  <?php else: ?>
    <form method="post">
      <?php wp_nonce_field('flippio_ux_save','flippio_ux_nonce'); ?>

      <table class="widefat striped">
        <thead>
          <tr>
            <th width="25%">Feltnavn (<code>name=</code>)</th>
            <th width="30%">Label/Beskrivelse</th>
            <th width="15%">Skjul (Create)</th>
            <th width="15%">Avansert (Create)</th>
            <th width="15%">Avansert (Edit)</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($fields as $name => $meta):
            $r = $rules[$name] ?? ['hide_create'=>0,'adv_create'=>1,'adv_edit'=>1];
          ?>
            <tr>
              <td><code><?php echo esc_html($name); ?></code></td>
              <td>
                <?php echo esc_html($meta['label'] ?? ''); ?>
                <?php if (!empty($meta['placeholder'])): ?>
                  <br><small><em>Placeholder: <?php echo esc_html($meta['placeholder']); ?></em></small>
                <?php endif; ?>
              </td>
              <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][hide_create]" <?php checked(!empty($r['hide_create'])); ?>></td>
              <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][adv_create]" <?php checked(!empty($r['adv_create'])); ?>></td>
              <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][adv_edit]"   <?php checked(!empty($r['adv_edit'])); ?>></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>

      <p><button class="button button-primary">💾 Lagre regler</button></p>
    </form>
  <?php endif; ?>
  
  <hr>
  
  <h3>Debug informasjon</h3>
  <p><strong>Plugin versjon:</strong> 0.1.0</p>
  <p><strong>Antall skannede felter:</strong> <?php echo count($fields); ?></p>
  <p><strong>Antall regler:</strong> <?php echo count($rules); ?></p>
  <p><strong>Plugin URL:</strong> <?php echo plugins_url('', __FILE__); ?></p>
</div>
