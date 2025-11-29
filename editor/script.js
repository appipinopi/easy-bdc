import Blocks from './blocks.js';
import PluginManager from './plugin-manager.js';

let workspace;
let pluginManager;
const STORAGE_KEY = 'discord_bot_builder_workspace_v5';

Blockly.Blocks['custom_python_code'] = {
  init: function () {
    this.appendDummyInput().appendField('🐍 Pythonコード実行');
    this.appendDummyInput().appendField(
      new Blockly.FieldMultilineInput("print('Hello World')"),
      'CODE',
    );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.setTooltip('任意のPythonコードをここに記述して実行させます。');
  },
};

const setupBlocklyEnvironment = () => {
  // Modern Theme Definition
  const modernLightTheme = Blockly.Theme.defineTheme('modernLight', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#f8fafc', // slate-50
      toolboxBackgroundColour: '#ffffff',
      toolboxForegroundColour: '#475569',
      flyoutBackgroundColour: '#ffffff',
      flyoutForegroundColour: '#475569',
      flyoutOpacity: 0.95,
      scrollbarColour: '#cbd5e1',
      insertionMarkerColour: '#6366f1', // Indigo
      insertionMarkerOpacity: 0.3,
      cursorColour: '#6366f1',
    },
    fontStyle: {
      family: 'Plus Jakarta Sans, sans-serif',
      weight: '600',
      size: 12,
    },
  });

  const modernDarkTheme = Blockly.Theme.defineTheme('modernDark', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#020617', // slate-950
      toolboxBackgroundColour: '#0f172a', // slate-900
      toolboxForegroundColour: '#cbd5e1',
      flyoutBackgroundColour: '#0f172a',
      flyoutForegroundColour: '#cbd5e1',
      flyoutOpacity: 0.95,
      scrollbarColour: '#334155',
      insertionMarkerColour: '#818cf8', // Indigo light
      insertionMarkerOpacity: 0.3,
      cursorColour: '#818cf8',
    },
    fontStyle: {
      family: 'Plus Jakarta Sans, sans-serif',
      weight: '600',
      size: 12,
    },
    blockStyles: {
      hat_blocks: { colourPrimary: '#a55b80' },
    },
  });

  Blockly.Python = Blocks.Python;
  Blockly.Blocks = Blocks.Blocks;
  Blockly.Python.INDENT = '    ';

  return { modernLightTheme, modernDarkTheme };
};

const html = document.documentElement;

// --- Code Generation & UI Sync ---
const generatePythonCode = () => {
  if (!workspace) return '';
  let rawCode = Blockly.Python.workspaceToCode(workspace);

  // --- Event Handlers for Dynamic Components ---
  let componentEvents = '';
  let modalEvents = '';

  // Parse raw code to extract event handlers
  const lines = rawCode.split('\n');
  let filteredLines = [];
  let currentEventName = null;
  let currentEventBody = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('# BUTTON_EVENT:')) {
      currentEventName = line.split(':')[1].trim();
      componentEvents +=
        componentEvents += `            if interaction.data.get('custom_id') == '${currentEventName}':\n                await on_button_${currentEventName}(interaction)\n`;
      filteredLines.push(line); // Keep definition
    } else if (line.includes('# MODAL_EVENT:')) {
      currentEventName = line.split(':')[1].trim();
      modalEvents += `            if interaction.data.get('custom_id') == '${currentEventName}':\n                await on_modal_${currentEventName}(interaction)\n`;
      filteredLines.push(line);
    } else {
      filteredLines.push(line);
    }
  }

  rawCode = filteredLines.join('\n');
  if (!componentEvents.trim()) componentEvents = '            pass';

  if (!modalEvents.trim()) modalEvents = '            pass';

  // --- Optimized Boilerplate ---
  const boilerplate = `
# Easy Discord Bot Builderによって作成されました！ 製作：@himais0giiiin
# Created with Easy Discord Bot Builder! created by @himais0giiiin!
# Optimized Version

import discord
from discord import app_commands
from discord.ext import commands
from discord import ui
import random
import asyncio
import datetime
import math
import json
import os
import logging

# ロギング設定 (Logging Setup)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

intents = discord.Intents.default()
intents.message_content = True 
intents.members = True 
intents.voice_states = True

# Botの作成
bot = commands.Bot(command_prefix='!', intents=intents)

# グローバルエラーハンドラー
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    logging.error(f"Command Error: {error}")

# ---JSON操作---
def _load_json_data(filename):
    if not os.path.exists(filename):
        return {}
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"JSON Load Error: {e}")
        return {}

def _save_json_data(filename, data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logging.error(f"JSON Save Error: {e}")

# --- モーダルクラス ---
class EasyModal(discord.ui.Modal):
    def __init__(self, title, custom_id, inputs):
        super().__init__(title=title, timeout=None, custom_id=custom_id)
        for item in inputs:
            self.add_item(discord.ui.TextInput(label=item['label'], custom_id=item['id']))

# --- インタラクションハンドラー ---
@bot.event
async def on_interaction(interaction):
    try:
        if interaction.type == discord.InteractionType.component:
${componentEvents}
        elif interaction.type == discord.InteractionType.modal_submit:
${modalEvents}
    except Exception as e:
        print(f"Interaction Error: {e}")

# ----------------------------

# --- ユーザー作成部分 ---
${rawCode}
# --------------------------

if __name__ == "__main__":
    # Token check
    # bot.run('TOKEN') # 実行時はここにTokenを入れてください!
    pass
`;
  return boilerplate.trim();
};

const updateLivePreview = () => {
  const code = generatePythonCode();
  const preview = document.getElementById('codePreviewContent');
  preview.textContent = code;
  hljs.highlightElement(preview);
};

const toggleTheme = (modernLightTheme, modernDarkTheme) => {
  const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.classList.remove(currentTheme);
  html.classList.add(newTheme);
  localStorage.setItem('theme', newTheme);
  if (workspace) {
    workspace.setTheme(newTheme === 'dark' ? modernDarkTheme : modernLightTheme);
  }
};

const initializeApp = () => {
  lucide.createIcons();
  const { modernLightTheme, modernDarkTheme } = setupBlocklyEnvironment();

  const blocklyDiv = document.getElementById('blocklyDiv');
  const toolbox = document.getElementById('toolbox');
  const themeToggle = document.getElementById('themeToggle');
  // ヘッダーのコード生成ボタン
  const showCodeBtn = document.getElementById('showCodeBtn');
  // モーダル関連
  const codeModal = document.getElementById('codeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const codeOutput = document.getElementById('codeOutput');
  const copyCodeBtn = document.getElementById('copyCodeBtn');

  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const workspaceContainer = document.getElementById('workspace-container');
  const layoutBlockBtn = document.getElementById('layoutBlockBtn');
  const layoutSplitBtn = document.getElementById('layoutSplitBtn');

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') html.classList.add('dark');
  const initialTheme = savedTheme === 'dark' ? modernDarkTheme : modernLightTheme;

  // --- パレット固定化の強制適用 (Zoom Fix) ---
  // フライアウト（パレット）のスケールを常に1に固定するオーバーライド
  Blockly.VerticalFlyout.prototype.getFlyoutScale = function () {
    return 1;
  };

  workspace = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    horizontalLayout: false,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
    renderer: 'zelos',
    theme: initialTheme,
  });

  // --- パレット（フライアウト）の固定設定 ---
  if (workspace.getToolbox()) {
    const flyout = workspace.getToolbox().getFlyout();
    if (flyout) {
      flyout.autoClose = false;
    }
  }

  // --- Layout Switching Logic ---
  const setLayout = (mode) => {
    if (mode === 'split') {
      workspaceContainer.classList.add('split-view');
      layoutSplitBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
      layoutSplitBtn.classList.add(
        'bg-white',
        'dark:bg-slate-800',
        'shadow-sm',
        'text-indigo-600',
        'dark:text-indigo-400',
      );

      layoutBlockBtn.classList.remove(
        'bg-white',
        'dark:bg-slate-800',
        'shadow-sm',
        'text-indigo-600',
        'dark:text-indigo-400',
      );
      layoutBlockBtn.classList.add('text-slate-500', 'dark:text-slate-400');
      updateLivePreview();
    } else {
      workspaceContainer.classList.remove('split-view');
      layoutBlockBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
      layoutBlockBtn.classList.add(
        'bg-white',
        'dark:bg-slate-800',
        'shadow-sm',
        'text-indigo-600',
        'dark:text-indigo-400',
      );

      layoutSplitBtn.classList.remove(
        'bg-white',
        'dark:bg-slate-800',
        'shadow-sm',
        'text-indigo-600',
        'dark:text-indigo-400',
      );
      layoutSplitBtn.classList.add('text-slate-500', 'dark:text-slate-400');
    }
    setTimeout(() => Blockly.svgResize(workspace), 350);
  };

  layoutBlockBtn.addEventListener('click', () => setLayout('block'));
  layoutSplitBtn.addEventListener('click', () => setLayout('split'));

  // --- Realtime Sync ---
  workspace.addChangeListener((e) => {
    // UIイベント以外で更新
    if (e.type !== Blockly.Events.UI && workspaceContainer.classList.contains('split-view')) {
      updateLivePreview();
    }

    // Auto Save
    if (!e.isUiEvent && e.type !== Blockly.Events.FINISHED_LOADING) {
      const xml = Blockly.Xml.workspaceToDom(workspace);
      localStorage.setItem(STORAGE_KEY, Blockly.Xml.domToText(xml));
      const saveStatus = document.getElementById('saveStatus');
      saveStatus.setAttribute('data-show', 'true');
      setTimeout(() => saveStatus.setAttribute('data-show', 'false'), 2000);
    }
  });

  // --- Toolbox Pin Button (Re-implementation) ---
  const pinBtn = document.createElement('button');
  pinBtn.id = 'toolboxPinBtn';
  pinBtn.className =
    'absolute z-20 p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50';
  pinBtn.style.top = '12px';

  const updatePinState = () => {
    if (!workspace) return;
    const toolbox = workspace.getToolbox();
    if (!toolbox) return;

    let isVisible = true;
    if (typeof toolbox.isVisible === 'function') {
      isVisible = toolbox.isVisible();
    } else if (typeof toolbox.getWidth === 'function') {
      isVisible = toolbox.getWidth() > 0;
    }

    const width = typeof toolbox.getWidth === 'function' ? toolbox.getWidth() : 0;

    if (isVisible) {
      pinBtn.style.left = `${width - 38}px`;
      pinBtn.innerHTML =
        '<i data-lucide="pin" class="w-3.5 h-3.5 fill-indigo-500 text-indigo-600"></i>';
      pinBtn.classList.add('bg-white', 'dark:bg-slate-800');
    } else {
      pinBtn.style.left = '12px';
      pinBtn.innerHTML = '<i data-lucide="pin-off" class="w-3.5 h-3.5"></i>';
      pinBtn.classList.remove('bg-white', 'dark:bg-slate-800');
      pinBtn.classList.add('bg-white/80', 'dark:bg-slate-800/80', 'backdrop-blur-sm');
    }
    lucide.createIcons();
  };

  pinBtn.onclick = () => {
    const toolbox = workspace.getToolbox();
    if (!toolbox) return;
    const isVisible =
      typeof toolbox.isVisible === 'function' ? toolbox.isVisible() : toolbox.getWidth() > 0;
    if (typeof toolbox.setVisible === 'function') toolbox.setVisible(!isVisible);
    Blockly.svgResize(workspace);
    setTimeout(updatePinState, 50);
  };
  document.getElementById('blocklyDiv').appendChild(pinBtn);
  setTimeout(updatePinState, 100);
  window.addEventListener('resize', () => {
    Blockly.svgResize(workspace);
    updatePinState();
  });
  workspace.addChangeListener((e) => {
    if (e.type === Blockly.Events.TOOLBOX_ITEM_SELECT) setTimeout(updatePinState, 50);
  });

  // --- Load Saved Data ---
  const xmlText = localStorage.getItem(STORAGE_KEY);
  if (xmlText) {
    try {
      Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.textToDom(xmlText), workspace);
    } catch (e) {
      console.error(e);
    }
  }

  themeToggle.addEventListener('click', () => toggleTheme(modernLightTheme, modernDarkTheme));

  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.textToDom(e.target.result), workspace);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  exportBtn.addEventListener('click', () => {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const blob = new Blob([Blockly.Xml.domToText(xml)], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-project.xml`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // --- モーダル表示ロジック (アニメーション付き) ---
  showCodeBtn.addEventListener('click', () => {
    showCodeBtn.blur();
    // Blocklyの選択ハイライトなどを解除
    if (workspace) Blockly.hideChaff();
    codeOutput.textContent = generatePythonCode();
    codeModal.classList.remove('hidden');
    codeModal.classList.add('flex');
    // Force reflow
    void codeModal.offsetWidth;
    codeModal.classList.add('show-modal');
  });

  closeModalBtn.addEventListener('click', () => {
    codeModal.classList.remove('show-modal');
    setTimeout(() => {
      codeModal.classList.remove('flex');
      codeModal.classList.add('hidden');
    }, 300); // Wait for transition
  });

  copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.textContent);
    const originalHtml = copyCodeBtn.innerHTML;
    copyCodeBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> コピー完了';
    copyCodeBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
    copyCodeBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500', 'border-emerald-400');
    lucide.createIcons();

    setTimeout(() => {
      copyCodeBtn.innerHTML = originalHtml;
      copyCodeBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
      copyCodeBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500', 'border-emerald-400');
      lucide.createIcons();
    }, 2000);
  });

  // --- Initialize Plugin Manager ---
  pluginManager = new PluginManager(workspace, Blockly);
  
  // --- EDBP Plugin Loader Modal Logic ---
  const edbpBtn = document.getElementById('edbpBtn');
  const edbpModal = document.getElementById('edbpModal');
  const closeEdpbModalBtn = document.getElementById('closeEdpbModalBtn');
  
  // Tab switching
  const tabButtons = document.querySelectorAll('.edbp-tab-btn');
  const tabContents = document.querySelectorAll('.edbp-tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update active state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => {
        content.classList.add('hidden');
      });
      
      // Map tab names to content IDs
      const tabContentMap = {
        'list': 'edbpContentList',
        'dl': 'edbpContentDL',
        'shop': 'edbpContentShop'
      };
      
      const contentId = tabContentMap[targetTab];
      if (contentId) {
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
          contentElement.classList.remove('hidden');
        }
      }
      
      // Load content based on tab
      if (targetTab === 'list') {
        loadPluginList();
      } else if (targetTab === 'shop') {
        loadShopPlugins();
      }
      // DLタブは既にHTMLにコンテンツがあるので、特別な読み込みは不要
    });
  });
  
  // Load plugin list
  const loadPluginList = () => {
    const plugins = pluginManager.loadInstalledPlugins();
    const listContainer = document.getElementById('edbpPluginList');
    
    if (plugins.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-8 text-slate-500 dark:text-slate-400">
          <i data-lucide="package" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p>インストールされているプラグインはありません</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    listContainer.innerHTML = plugins.map(plugin => {
      const isLoaded = pluginManager.loadedPlugins.has(plugin.id);
      const isEnabled = plugin.enabled !== false;
      
      return `
      <div class="edbp-plugin-card">
        <div class="flex items-center justify-between">
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-bold text-slate-800 dark:text-white text-base">${plugin.name}</h4>
              ${plugin.official ? '<span class="edbp-plugin-official"><i data-lucide="shield-check" class="w-3 h-3"></i>公式</span>' : 
                plugin.approved ? '<span class="edbp-plugin-approved"><i data-lucide="shield" class="w-3 h-3"></i>公認</span>' : 
                '<span class="edbp-plugin-unofficial"><i data-lucide="alert-triangle" class="w-3 h-3"></i>非公式</span>'}
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">${plugin.description || '説明なし'}</p>
            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
              <span>作者: ${plugin.author}</span>
              <span>バージョン: ${plugin.version}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4 shrink-0">
            <label class="relative inline-flex items-center cursor-pointer" title="${isEnabled ? '無効化' : '有効化'}">
              <input type="checkbox" class="edbp-plugin-toggle sr-only peer" data-plugin-id="${plugin.id}" ${isEnabled ? 'checked' : ''}>
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
            <button class="edbp-load-plugin-btn p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors" data-plugin-id="${plugin.id}" title="読み込む">
              <i data-lucide="play" class="w-4 h-4"></i>
            </button>
            <button class="edbp-uninstall-plugin-btn p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" data-plugin-id="${plugin.id}" title="アンインストール">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
    
    lucide.createIcons();
    
    // Event listeners for plugin actions
    document.querySelectorAll('.edbp-load-plugin-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pluginId = btn.getAttribute('data-plugin-id');
        const result = await pluginManager.loadPlugin(pluginId);
        if (result.success) {
          alert('プラグインを読み込みました');
          Blockly.svgResize(workspace);
          loadPluginList(); // リストを更新
        } else {
          alert(`エラー: ${result.error}`);
        }
      });
    });
    
    document.querySelectorAll('.edbp-uninstall-plugin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.getAttribute('data-plugin-id');
        const plugin = pluginManager.plugins.get(pluginId);
        if (confirm(`プラグイン "${plugin?.name || pluginId}" をアンインストールしますか？`)) {
          pluginManager.uninstallPlugin(pluginId);
          loadPluginList();
        }
      });
    });
    
    // Toggle switch handlers
    document.querySelectorAll('.edbp-plugin-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const pluginId = toggle.getAttribute('data-plugin-id');
        const isEnabled = toggle.checked;
        const plugin = pluginManager.plugins.get(pluginId);
        
        if (!plugin) return;
        
        // プラグインの有効/無効状態を更新
        plugin.enabled = isEnabled;
        pluginManager.savePlugins();
        
        if (isEnabled) {
          // 有効化: プラグインを読み込む
          const result = await pluginManager.loadPlugin(pluginId);
          if (result.success) {
            Blockly.svgResize(workspace);
          } else {
            // 読み込みに失敗した場合はトグルを戻す
            toggle.checked = false;
            plugin.enabled = false;
            pluginManager.savePlugins();
            alert(`プラグインの読み込みに失敗しました: ${result.error}`);
          }
        } else {
          // 無効化: プラグインをアンロード
          pluginManager.unloadPlugin(pluginId);
          Blockly.svgResize(workspace);
        }
        
        loadPluginList(); // リストを更新
      });
    });
  };
  
  // Shop plugins data storage
  let shopPluginsData = [];
  
  // Load shop plugins
  const loadShopPlugins = async () => {
    const shopContainer = document.getElementById('edbpShopList');
    shopContainer.innerHTML = `
      <div class="text-center py-8 text-slate-500 dark:text-slate-400">
        <i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto mb-2"></i>
        <p>プラグインを読み込んでいます...</p>
      </div>
    `;
    lucide.createIcons();
    
    try {
      shopPluginsData = await pluginManager.fetchGitHubPlugins();
      renderShopPlugins(shopPluginsData);
    } catch (e) {
      shopContainer.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3"></i>
          <p>エラー: ${e.message}</p>
        </div>
      `;
      lucide.createIcons();
    }
  };
  
  // Render shop plugins with filtering
  const renderShopPlugins = (plugins) => {
    const shopContainer = document.getElementById('edbpShopList');
    
    if (plugins.length === 0) {
      shopContainer.innerHTML = `
        <div class="text-center py-8 text-slate-500 dark:text-slate-400">
          <i data-lucide="package-x" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p>プラグインが見つかりませんでした</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    shopContainer.innerHTML = plugins.map(plugin => {
      const isInstalled = pluginManager.plugins.has(plugin.id);
      const canInstall = plugin.official || plugin.approved; // 公式または公認はインストール可能
      
      // バッジの決定: 公式 > 公認 > なし
      let badgeHtml = '';
      if (plugin.official) {
        badgeHtml = '<span class="edbp-plugin-official"><i data-lucide="shield-check" class="w-3 h-3"></i>公式</span>';
      } else if (plugin.approved) {
        badgeHtml = '<span class="edbp-plugin-approved"><i data-lucide="shield" class="w-3 h-3"></i>公認</span>';
      }
      
      return `
        <div class="edbp-plugin-card" data-plugin-name="${plugin.name.toLowerCase()}" data-plugin-author="${plugin.author.toLowerCase()}" data-plugin-description="${(plugin.description || '').toLowerCase()}">
          <div class="flex items-start justify-between">
            <div class="flex-grow">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="font-bold text-slate-800 dark:text-white">${plugin.name}</h4>
                ${badgeHtml}
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">${plugin.description || '説明なし'}</p>
              <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mb-2">
                <span>作者: ${plugin.author}</span>
                <span>バージョン: ${plugin.version}</span>
              </div>
              <div class="flex items-center gap-3 mt-2">
                ${plugin.repoUrl ? `<a href="${plugin.repoUrl}" target="_blank" class="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                  <i data-lucide="external-link" class="w-3 h-3"></i>
                  GitHubで見る
                </a>` : ''}
                ${plugin.repoUrl ? `<button class="edbp-read-readme-btn text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1" data-repo-url="${plugin.repoUrl}">
                  <i data-lucide="file-text" class="w-3 h-3"></i>
                  READMEを見る
                </button>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              ${isInstalled 
                ? '<span class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm rounded-lg">インストール済み</span>'
                : canInstall
                  ? `<button class="edbp-install-shop-plugin-btn px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1" data-plugin-url="${plugin.downloadUrl}" data-plugin-id="${plugin.id}">
                      <i data-lucide="download" class="w-4 h-4"></i>
                      <span>インストール</span>
                    </button>`
                  : '<span class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm rounded-lg opacity-50">表示のみ</span>'
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    lucide.createIcons();
    
    // Install button handlers
    document.querySelectorAll('.edbp-install-shop-plugin-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pluginUrl = btn.getAttribute('data-plugin-url');
        const pluginId = btn.getAttribute('data-plugin-id');
        
        if (!pluginUrl) {
          alert('ダウンロードURLが設定されていません');
          return;
        }
        
        // インストール情報をLocalStorageに保存（自動インストール用）
        const installInfo = {
          url: pluginUrl,
          pluginId: pluginId,
          timestamp: Date.now()
        };
        localStorage.setItem('edbp_pending_install', JSON.stringify(installInfo));
        
        btn.disabled = true;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>';
        lucide.createIcons();
        
        try {
          let response;
          let fetchUrl = pluginUrl;
          
          // Cloudflare Workerのプロキシ経由で取得を試みる
          // 現在のドメインからプロキシにアクセス
          const currentOrigin = window.location.origin;
          const proxyUrl = `${currentOrigin}/proxy/${encodeURIComponent(pluginUrl)}`;
          
          try {
            // まずプロキシ経由で試す
            response = await fetch(proxyUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            // プロキシが404やエラーを返した場合は直接取得を試す
            if (!response.ok && response.status !== 200) {
              throw new Error('Proxy failed');
            }
          } catch (proxyError) {
            // プロキシが失敗した場合は直接取得を試す
            try {
              response = await fetch(pluginUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
              });
            } catch (directError) {
              // CORSエラーの場合、エラーメッセージを改善
              if (directError.message.includes('Failed to fetch') || directError.message.includes('CORS')) {
                throw new Error(`ダウンロードに失敗しました（CORSエラーの可能性）。\n\n解決方法:\nZIPファイルをダウンロードして「ZIPファイルを選択」からインストールしてください`);
              }
              throw directError;
            }
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const blob = await response.blob();
          const file = new File([blob], `${pluginId}.zip`, { type: 'application/zip' });
          
          // プログレス表示用のモーダルを作成
          const progressModal = document.createElement('div');
          progressModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm';
          progressModal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-800">
              <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4">プラグインをインストール中...</h3>
              <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
                <span id="shopProgressText">ZIPファイルをダウンロードしています...</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                <div id="shopProgressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>
          `;
          document.body.appendChild(progressModal);
          lucide.createIcons();
          
          const progressText = document.getElementById('shopProgressText');
          const progressBar = document.getElementById('shopProgressBar');
          
          const result = await pluginManager.installFromZip(file, (progress) => {
            if (progressText) progressText.textContent = progress.step;
            if (progressBar) progressBar.style.width = `${progress.progress}%`;
          });
          
          progressModal.remove();
          
          // インストール成功したらLocalStorageから削除
          localStorage.removeItem('edbp_pending_install');
          
          if (result.success) {
            alert(`プラグイン「${result.plugin.name}」をインストールしました`);
            loadShopPlugins();
            loadPluginList();
          } else {
            alert(`インストールエラー: ${result.error}`);
          }
        } catch (e) {
          localStorage.removeItem('edbp_pending_install');
          alert(`エラー: ${e.message}`);
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          lucide.createIcons();
        }
      });
    });
    
    // README表示ボタンのハンドラー
    document.querySelectorAll('.edbp-read-readme-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const repoUrl = btn.getAttribute('data-repo-url');
        if (!repoUrl) return;
        
        // GitHubのREADME URLを生成
        const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!repoMatch) {
          alert('GitHubリポジトリのURLを取得できませんでした');
          return;
        }
        
        const [, owner, repo] = repoMatch;
        const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        
        // README表示モーダル
        const readmeModal = document.createElement('div');
        readmeModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm';
        readmeModal.innerHTML = `
          <div class="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between mb-4 shrink-0">
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">README</h3>
              <button class="edbp-close-readme-btn p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            <div class="flex-grow overflow-y-auto">
              <div id="edbpReadmeContent" class="prose prose-slate dark:prose-invert max-w-none p-4">
                <div class="text-center py-8">
                  <i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400"></i>
                  <p class="text-slate-500">READMEを読み込んでいます...</p>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(readmeModal);
        lucide.createIcons();
        
        const closeBtn = readmeModal.querySelector('.edbp-close-readme-btn');
        closeBtn.addEventListener('click', () => {
          readmeModal.remove();
        });
        
        readmeModal.addEventListener('click', (e) => {
          if (e.target === readmeModal) {
            readmeModal.remove();
          }
        });
        
        try {
          const response = await fetch(readmeUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          const readmeContent = atob(data.content);
          
          // MarkdownをHTMLに変換（簡易版）
          const readmeHtml = readmeContent
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
          
          document.getElementById('edbpReadmeContent').innerHTML = `
            <div class="markdown-body">
              ${readmeHtml}
            </div>
          `;
          lucide.createIcons();
        } catch (e) {
          document.getElementById('edbpReadmeContent').innerHTML = `
            <div class="text-center py-8 text-red-500">
              <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3"></i>
              <p>READMEの読み込みに失敗しました: ${e.message}</p>
            </div>
          `;
          lucide.createIcons();
        }
      });
    });
  };
  
  // Search functionality
  const shopSearchInput = document.getElementById('edbpShopSearch');
  if (shopSearchInput) {
    shopSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      if (!searchTerm) {
        renderShopPlugins(shopPluginsData);
        return;
      }
      
      const filtered = shopPluginsData.filter(plugin => {
        return plugin.name.toLowerCase().includes(searchTerm) ||
               plugin.author.toLowerCase().includes(searchTerm) ||
               (plugin.description || '').toLowerCase().includes(searchTerm);
      });
      
      renderShopPlugins(filtered);
    });
  }
  
  // DL tab: ZIP file installation
  const zipInput = document.getElementById('edbpZipInput');
  const selectZipBtn = document.getElementById('edbpSelectZipBtn');
  const installStatus = document.getElementById('edbpInstallStatus');
  const dropZone = document.getElementById('edbpDropZone');
  
  // File upload handler
  if (selectZipBtn && zipInput) {
    selectZipBtn.addEventListener('click', () => {
      zipInput.click();
    });
    
    zipInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await installPluginFromFile(file);
      e.target.value = '';
    });
  }
  
  // Drag and Drop handler
  if (dropZone) {
    // ドラッグオーバー時のスタイル
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
    });
    
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.zip') || file.type === 'application/zip') {
          await installPluginFromFile(file);
        } else {
          installStatus.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                <i data-lucide="x-circle" class="w-4 h-4"></i>
                <span>ZIPファイルを選択してください</span>
              </div>
            </div>
          `;
          lucide.createIcons();
        }
      }
    });
  }
  
  // Install plugin from file
  const installPluginFromFile = async (file) => {
    // プログレス表示
    installStatus.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
          <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
          <span id="edbpProgressText">ZIPファイルを読み込んでいます...</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
          <div id="edbpProgressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    const progressText = document.getElementById('edbpProgressText');
    const progressBar = document.getElementById('edbpProgressBar');
    
    const result = await pluginManager.installFromZip(file, (progress) => {
      if (progressText) progressText.textContent = progress.step;
      if (progressBar) progressBar.style.width = `${progress.progress}%`;
    });
    
    if (result.success) {
      installStatus.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div class="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>インストール成功: ${result.plugin.name}</span>
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            <p>プラグインが自動的に保存されました。</p>
            <p class="mt-1">「List」タブでプラグインを確認できます。</p>
          </div>
        </div>
      `;
      loadPluginList();
    } else {
      installStatus.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
            <i data-lucide="x-circle" class="w-4 h-4"></i>
            <span>エラー: ${result.error}</span>
          </div>
        </div>
      `;
    }
    lucide.createIcons();
  };
  
  
  // Refresh shop button
  const refreshShopBtn = document.getElementById('edbpRefreshShop');
  if (refreshShopBtn) {
    refreshShopBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('edbpShopSearch');
      if (searchInput) searchInput.value = '';
      loadShopPlugins();
    });
  }

  edbpBtn.addEventListener('click', () => {
    edbpBtn.blur();
    if (workspace) Blockly.hideChaff();
    edbpModal.classList.remove('hidden');
    edbpModal.classList.add('flex');
    void edbpModal.offsetWidth;
    edbpModal.classList.add('show-modal');
    // Load initial content
    loadPluginList();
  });

  closeEdpbModalBtn.addEventListener('click', () => {
    edbpModal.classList.remove('show-modal');
    setTimeout(() => {
      edbpModal.classList.remove('flex');
      edbpModal.classList.add('hidden');
    }, 300);
  });
  
  // Load all plugins on startup
  pluginManager.loadAllPlugins().then(results => {
    console.log('Loaded plugins:', results);
    Blockly.svgResize(workspace);
  });
  
  // Check for pending installation (from web/other sources)
  const checkPendingInstall = async () => {
    const pendingInstall = localStorage.getItem('edbp_pending_install');
    if (pendingInstall) {
      try {
        const installInfo = JSON.parse(pendingInstall);
        // 5分以内のインストールリクエストのみ処理
        if (Date.now() - installInfo.timestamp < 5 * 60 * 1000) {
          const installStatus = document.getElementById('edbpInstallStatus');
          if (installStatus) {
            installStatus.innerHTML = `
              <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <i data-lucide="info" class="w-4 h-4"></i>
                  <span>自動インストールを開始します...</span>
                </div>
              </div>
            `;
            lucide.createIcons();
            
            // URLからのインストールは現在禁止されているため、エラーメッセージを表示
            installStatus.innerHTML = `
              <div class="bg-white dark:bg-slate-900 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div class="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                  <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                  <span>URLからのインストールは現在利用できません</span>
                </div>
                <div class="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  <p>ZIPファイルをダウンロードして「ZIPファイルを選択」からインストールしてください。</p>
                </div>
              </div>
            `;
            lucide.createIcons();
            localStorage.removeItem('edbp_pending_install');
          }
        } else {
          // 古いリクエストは削除
          localStorage.removeItem('edbp_pending_install');
        }
      } catch (e) {
        console.error('Failed to process pending install:', e);
        localStorage.removeItem('edbp_pending_install');
      }
    }
  };
  
  // Check for pending install on modal open
  edbpBtn.addEventListener('click', () => {
    setTimeout(checkPendingInstall, 100);
  });
};

window.onload = initializeApp;