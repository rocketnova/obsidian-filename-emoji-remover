import { Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import type { FilenameLinterSettings } from './interfaces';
import FilenameLinterSettingTab from './settings';

const DEFAULT_SETTINGS: FilenameLinterSettings = {
	autoLintOnCreate: false,
	autoLintOnRename: false,
};

export default class FilenameLinter extends Plugin {
	settings: FilenameLinterSettings;

	lintFilename = async (file: TAbstractFile) => {
		const { fileManager } = this.app;

		if (!(file instanceof TFile)) {
			return;
		}

		const [filename, oldFilename, fileExtension] = [
			file.basename,
			file.basename,
			file.extension,
		];
		let newFilename = filename;

		let filePath = file.parent.path;

		// Replaces these bad filename characters: []:\/^|#
		newFilename = filename.replaceAll(/[\[\]:\/\^\|#]/ig, '');
		if (newFilename !== oldFilename) {
			// Make sure the new file name isn't empty
			// Randomize if it is
			if (newFilename.length === 0) {
				const randomNumber = Math.floor(1000 + Math.random() * 9000);
				newFilename = `file-${randomNumber}`;
			}

			let newFilePath = `${filePath}/${newFilename}.${fileExtension}`;
			try {
				await fileManager.renameFile(file, newFilePath);
				new Notice(`${oldFilename} renamed to ${newFilename}`);
			} catch (error) {
				new Notice(`Unable to rename ${oldFilename} to ${newFilename}. There probably already exists a file with this name`);
			}
		}
	};

	lintAllFilenames = async () => {
		const { vault } = this.app;

		await Promise.all(
			// Get all the files in the vault
			vault.getFiles().map(async (file) => {
				await this.lintFilename(file);
			})
		);
	};

	async autoLintOnCreateToggle(toggle: boolean) {
		this.app.vault.off('create', this.lintFilename);

		if (toggle) {
			this.registerEvent(
				this.app.vault.on('create', this.lintFilename)
			);
		}
	}

	async autoLintOnRenameToggle(toggle: boolean) {
		this.app.vault.off('rename', this.lintFilename);

		if (toggle) {
			this.registerEvent(
				this.app.vault.on('rename', this.lintFilename)
			);
		}
	}

	async onload() {
		await this.loadSettings();

		if (this.settings.autoLintOnCreate) {
			this.autoLintOnCreateToggle(true);
		}

		if (this.settings.autoLintOnRename) {
			this.autoLintOnRenameToggle(true);
		}

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'lint-all-filenames',
			name: 'Lint all filenames in the vault',
			callback: () => {
				this.lintAllFilenames();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FilenameLinterSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
