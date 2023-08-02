import { App, PluginSettingTab, Setting } from 'obsidian';
import type FilenameLinter from './main';

export default class FilenameLinterSettingTab extends PluginSettingTab {
	plugin: FilenameLinter;

	constructor(app: App, plugin: FilenameLinter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Remove manually')
			.setDesc(
				'Lint all filenames in the vault'
			)
			.addButton((button) =>
				button
					.setWarning()
					.setButtonText('Lint')
					.onClick(async (evt: MouseEvent) => {
						await this.plugin.lintAllFilenames();
					})
			);

		new Setting(containerEl)
			.setName('Auto-lint new files')
			.setDesc(
				'When a new file is created, automatically lint its name'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoLintOnCreate)
					.onChange(async (value) => {
						this.plugin.settings.autoLintOnCreate = value;
						await this.plugin.saveSettings();
						this.plugin.autoLintOnCreateToggle(value);
					})
			);

	}
}
