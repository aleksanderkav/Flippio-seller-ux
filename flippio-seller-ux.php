<?php
/**
 * Plugin Name: Flippio Seller UX
 * Description: Forenkler oppretting/redigering av Dokan auksjonsprodukter. Minimal skjema ved oppretting, avanserte valg ved redigering. Felt-skanner + innstillinger.
 * Version: 0.1.0
 * Author: Flippio AS
 * License: GPLv2 or later
 * Text Domain: flippio-seller-ux
 */

if (!defined('ABSPATH')) exit;

final class Flippio_Seller_UX {
  const OPT_FIELDS = 'flippio_seller_ux_fields'; // skannet feltliste
  const OPT_RULES  = 'flippio_seller_ux_rules';  // regler for hide/move

  public function __construct() {
    // Frontend (Dokan seller dashboard)
    add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);

    // Admin: meny + lagring av settings
    add_action('admin_menu', [$this, 'admin_menu']);
    add_action('admin_init', [$this, 'maybe_save_rules']);

    // AJAX: lagre skannede felt (admin)
    add_action('wp_ajax_flippio_store_fields', [$this, 'ajax_store_fields']);

    // Sikkerhetsnett: sett defaults server-side ved create/update
    add_action('dokan_new_product_added', [$this, 'apply_safe_defaults'], 10, 2);
    add_action('dokan_product_updated',   [$this, 'apply_safe_defaults'], 10, 2);
  }

  /** Enqueue kun på selger-dashbordets produktsider */
  public function enqueue_assets() {
    // Sjekk om vi er på en Dokan-side
    if (!function_exists('dokan_is_seller_dashboard')) {
      // Fallback: sjekk om vi er på en side med Dokan-klasser
      global $post;
      if (!$post || !has_shortcode($post->post_content, 'dokan-dashboard')) {
        return;
      }
    } elseif (!dokan_is_seller_dashboard()) {
      return;
    }

    // Debug: log at vi laster assets
    error_log('Flippio Seller UX: Laster assets på Dokan-side');

    // Vi laster alltid på dashboard, men JS sjekker om form finnes før den gjør noe.
    wp_register_script(
      'flippio-seller-ux',
      plugins_url('seller-ux.js', __FILE__),
      ['jquery'],
      '0.1.0',
      true
    );

    $is_edit  = isset($_GET['product_id']) && absint($_GET['product_id']) > 0;
    // Heuristikk for "add auction" – tilpass om du har spesifikk URL/param
    $is_auction_create = !$is_edit && (isset($_GET['auction']) || isset($_GET['type']) && $_GET['type'] === 'auction');

    $rules = get_option(self::OPT_RULES, []);
    wp_localize_script('flippio-seller-ux', 'FLIPPIO_SELLER_UX', [
      'is_edit'            => (bool) $is_edit,
      'is_auction_create'  => (bool) $is_auction_create,
      'is_admin'           => current_user_can('manage_options'),
      'rules'              => $rules,
      'ajaxurl'            => admin_url('admin-ajax.php'),
      'debug'              => WP_DEBUG,
    ]);

    wp_enqueue_script('flippio-seller-ux');

    // Litt base-CSS
    $css = '.flippio-advanced{display:none;margin-top:12px;border:1px dashed #e5e7eb;padding:12px;border-radius:10px}
            .flippio-adv-btn{margin-top:8px}
            .flippio-help{font-size:12px;opacity:.8;margin-top:4px}
            .flippio-scan-btn{background:#0073aa !important;color:white !important;border:none !important;padding:8px 16px !important;border-radius:4px !important;cursor:pointer !important;}';
    wp_register_style('flippio-seller-ux-inline', false);
    wp_enqueue_style('flippio-seller-ux-inline');
    wp_add_inline_style('flippio-seller-ux-inline', $css);
  }

  /** Admin-meny */
  public function admin_menu() {
    add_options_page(
      __('Flippio Seller UX', 'flippio-seller-ux'),
      __('Flippio Seller UX', 'flippio-seller-ux'),
      'manage_options',
      'flippio-seller-ux',
      [$this, 'render_settings_page']
    );
  }

  public function render_settings_page() {
    if (!current_user_can('manage_options')) return;
    $fields = get_option(self::OPT_FIELDS, []);
    $rules  = get_option(self::OPT_RULES, []);
    require __DIR__ . '/admin/settings-page.php';
  }

  /** Lagring av regler fra settings-skjema */
  public function maybe_save_rules() {
    if (!isset($_POST['flippio_ux_nonce']) || !wp_verify_nonce($_POST['flippio_ux_nonce'],'flippio_ux_save')) return;
    if (!current_user_can('manage_options')) return;
    $rules = isset($_POST['rules']) ? (array) $_POST['rules'] : [];
    // Normaliser bools
    foreach ($rules as $name => &$r) {
      $r = [
        'hide_create' => !empty($r['hide_create']) ? 1 : 0,
        'adv_create'  => !empty($r['adv_create'])  ? 1 : 0,
        'adv_edit'    => !empty($r['adv_edit'])    ? 1 : 0,
      ];
    }
    update_option(self::OPT_RULES, $rules);
    add_settings_error('flippio_seller_ux', 'saved', __('Regler lagret.', 'flippio-seller-ux'), 'updated');
  }

  /** AJAX: lagre skannet feltliste (admin) */
  public function ajax_store_fields() {
    if (!current_user_can('manage_options')) wp_send_json_error('forbidden', 403);
    
    $fields_json = isset($_POST['fields']) ? wp_unslash($_POST['fields']) : '';
    $fields = json_decode($fields_json, true);
    
    if (!is_array($fields)) {
      wp_send_json_error('Invalid fields data', 400);
    }
    
    // Log for debugging
    error_log('Flippio Seller UX: Lagrer ' . count($fields) . ' felter');
    
    update_option(self::OPT_FIELDS, $fields);
    wp_send_json_success(['count' => count($fields)]);
  }

  /** Defaults/validering server-side for felter vi kan ha skjult */
  public function apply_safe_defaults($product_id, $data) {
    // Auction reserved price
    if (!metadata_exists('post', $product_id, '_auction_reserved_price')) {
      update_post_meta($product_id, '_auction_reserved_price', 0);
    }
    // Bid increment
    if (!metadata_exists('post', $product_id, '_auction_bid_increment')) {
      update_post_meta($product_id, '_auction_bid_increment', 10);
    }
    // Proxy bidding (0/1)
    if (!metadata_exists('post', $product_id, '_auction_proxy')) {
      update_post_meta($product_id, '_auction_proxy', 0);
    }
    // Auto relist (0/1)
    if (!metadata_exists('post', $product_id, '_auction_relist_enable')) {
      update_post_meta($product_id, '_auction_relist_enable', 0);
    }
    // Taxes
    if (!metadata_exists('post', $product_id, '_tax_status')) {
      update_post_meta($product_id, '_tax_status', 'taxable');
    }
  }
}
new Flippio_Seller_UX();
