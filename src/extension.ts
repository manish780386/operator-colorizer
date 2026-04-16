import * as vscode from 'vscode';

// Status bar item
let statusBarItem: vscode.StatusBarItem;
let isEnabled = true;

export function activate(context: vscode.ExtensionContext) {
  console.log('Operator Colorizer Pro is now active!');

  // Status bar banao
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'operator-colorizer.toggle';
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ✅ Command 1: Toggle ON/OFF
  const toggleCommand = vscode.commands.registerCommand(
    'operator-colorizer.toggle',
    () => {
      isEnabled = !isEnabled;
      updateStatusBar();
      vscode.window.showInformationMessage(
        isEnabled
          ? '✅ Operator Colorizer: ON'
          : '❌ Operator Colorizer: OFF'
      );
    }
  );

  // ✅ Command 2: Operator Stats
  const statsCommand = vscode.commands.registerCommand(
    'operator-colorizer.showStats',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Pehle koi file kholo!');
        return;
      }

      const text = editor.document.getText();
      const stats = countOperators(text);

      vscode.window.showInformationMessage(
        `📊 Operators: ➕ Arithmetic: ${stats.arithmetic} | 🔵 Comparison: ${stats.comparison} | 🟢 Logical: ${stats.logical} | 🩷 Assignment: ${stats.assignment} | 🟣 Bitwise: ${stats.bitwise}`
      );
    }
  );

  // ✅ Command 3: Customize Colors
  const customizeCommand = vscode.commands.registerCommand(
    'operator-colorizer.customizeColors',
    async () => {
      const options = [
        '🟠 Arithmetic operators ka color badlo',
        '🔵 Comparison operators ka color badlo',
        '🟢 Logical operators ka color badlo',
        '🩷 Assignment operators ka color badlo',
        '🟣 Bitwise operators ka color badlo'
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Kaunsa operator customize karna hai?'
      });

      if (!selected) return;

      const color = await vscode.window.showInputBox({
        placeHolder: '#FF9D00',
        prompt: 'Hex color code daalo (jaise #FF0000 for red)',
        validateInput: (val) => {
          return /^#[0-9A-Fa-f]{6}$/.test(val)
            ? null
            : 'Valid hex color daalo! Jaise: #FF9D00';
        }
      });

      if (!color) return;

      const config = vscode.workspace.getConfiguration('operatorColorizer');

      if (selected.includes('Arithmetic')) {
        await config.update('arithmeticColor', color, vscode.ConfigurationTarget.Global);
      } else if (selected.includes('Comparison')) {
        await config.update('comparisonColor', color, vscode.ConfigurationTarget.Global);
      } else if (selected.includes('Logical')) {
        await config.update('logicalColor', color, vscode.ConfigurationTarget.Global);
      } else if (selected.includes('Assignment')) {
        await config.update('assignmentColor', color, vscode.ConfigurationTarget.Global);
      } else if (selected.includes('Bitwise')) {
        await config.update('bitwiseColor', color, vscode.ConfigurationTarget.Global);
      }

      vscode.window.showInformationMessage(
        `✅ Color update ho gaya! Reload karo: Ctrl+Shift+P → "Reload Window"`
      );
    }
  );

  // ✅ Cursor move hone par status bar update karo
  const cursorEvent = vscode.window.onDidChangeTextEditorSelection((e) => {
    updateStatusBarWithCursor(e.textEditor);
  });

  // ✅ File change hone par bhi update karo
  const docEvent = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) updateStatusBarWithCursor(editor);
  });

  context.subscriptions.push(
    toggleCommand,
    statsCommand,
    customizeCommand,
    cursorEvent,
    docEvent
  );
}

// Operator count karne ka function
function countOperators(text: string) {
  return {
    arithmetic: (text.match(/(?<![=<>!])([+\-*\/%])(?!=)/g) || []).length,
    comparison: (text.match(/(===|!==|==|!=|>=|<=|>(?!>)|<(?!<))/g) || []).length,
    logical: (text.match(/(&&|\|\||!(?!=)|\?\?)/g) || []).length,
    assignment: (text.match(/(\+=|-=|\*=|\/=|%=|=(?!=))/g) || []).length,
    bitwise: (text.match(/(&(?!&)|\|(?!\|)|\^|~|<<|>>)/g) || []).length
  };
}

// Status bar update
function updateStatusBar() {
  if (isEnabled) {
    statusBarItem.text = '$(symbol-operator) Operators: ON';
    statusBarItem.tooltip = 'Operator Colorizer ON — Click to toggle OFF';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(symbol-operator) Operators: OFF';
    statusBarItem.tooltip = 'Operator Colorizer OFF — Click to toggle ON';
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  }
}

// Cursor ke paas operator hai toh status bar mein dikhao
function updateStatusBarWithCursor(editor: vscode.TextEditor) {
  if (!isEnabled) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line).text;
  const charAtCursor = line[position.character] || '';

  const operatorMap: { [key: string]: string } = {
    '+': '➕ Arithmetic',
    '-': '➖ Arithmetic',
    '*': '✖️ Arithmetic',
    '/': '➗ Arithmetic',
    '=': '🩷 Assignment',
    '!': '🟢 Logical',
    '&': '🟣 Bitwise',
    '|': '🟣 Bitwise',
    '^': '🟣 Bitwise',
    '<': '🔵 Comparison',
    '>': '🔵 Comparison',
    '%': '🟠 Arithmetic',
    '~': '🟣 Bitwise'
  };

  if (operatorMap[charAtCursor]) {
    statusBarItem.text = `$(symbol-operator) ${operatorMap[charAtCursor]} operator`;
  } else {
    updateStatusBar();
  }
}

export function deactivate() {
  if (statusBarItem) statusBarItem.dispose();
}