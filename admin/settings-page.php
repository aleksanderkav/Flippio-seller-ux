<?php
if (!defined('ABSPATH')) exit;
settings_errors('flippio_seller_ux');
$fields = is_array($fields) ? $fields : [];
$rules  = is_array($rules)  ? $rules  : [];
?>
<div class="wrap">
  <h1>Flippio Seller UX</h1>
  <p>Skann felter på Dokan-selgersiden (knapp vises for admin). Deretter huker du av hva som skal skjules/flyttes her.</p>

  <form method="post">
    <?php wp_nonce_field('flippio_ux_save','flippio_ux_nonce'); ?>

    <table class="widefat striped">
      <thead>
        <tr>
          <th width="28%">Feltname (<code>name=</code>)</th>
          <th width="28%">Label</th>
          <th width="14%">Skjul (Create)</th>
          <th width="15%">Avansert (Create)</th>
          <th width="15%">Avansert (Edit)</th>
        </tr>
      </thead>
      <tbody>
      <?php if (!$fields): ?>
        <tr><td colspan="5">Ingen felter er skannet enda. Gå til selgersiden → "Skann felter (admin)".</td></tr>
      <?php else: ?>
        <?php foreach ($fields as $name => $meta):
          $r = $rules[$name] ?? ['hide_create'=>0,'adv_create'=>1,'adv_edit'=>1];
        ?>
          <tr>
            <td><code><?php echo esc_html($name); ?></code></td>
            <td><?php echo esc_html($meta['label'] ?? ''); ?></td>
            <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][hide_create]" <?php checked(!empty($r['hide_create'])); ?>></td>
            <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][adv_create]" <?php checked(!empty($r['adv_create'])); ?>></td>
            <td><input type="checkbox" name="rules[<?php echo esc_attr($name); ?>][adv_edit]"   <?php checked(!empty($r['adv_edit'])); ?>></td>
          </tr>
        <?php endforeach; ?>
      <?php endif; ?>
      </tbody>
    </table>

    <p><button class="button button-primary">Lagre</button></p>
  </form>
</div>
