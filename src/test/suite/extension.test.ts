import * as assert from 'assert';

import * as vscode from 'vscode';
// import * as ofext from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

  test('Dummy test', () => {
    assert.strictEqual(true,true);
  });
	
});
