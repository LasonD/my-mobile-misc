import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

interface Entry {
  key: string;
  value: string | null;
}

@Component({
  selector: 'app-preferences',
  templateUrl: 'preferences.page.html',
  styleUrls: ['preferences.page.scss'],
  standalone: false,
})
export class PreferencesPage implements OnInit {
  key = '';
  value = '';
  entries: Entry[] = [];

  ngOnInit() {
    this.refresh();
  }

  async save() {
    if (!this.key.trim()) return;
    await Preferences.set({ key: this.key.trim(), value: this.value });
    this.key = '';
    this.value = '';
    this.refresh();
  }

  async remove(key: string) {
    await Preferences.remove({ key });
    this.refresh();
  }

  async clearAll() {
    await Preferences.clear();
    this.refresh();
  }

  async refresh() {
    const { keys } = await Preferences.keys();
    const pairs = await Promise.all(
      keys.map(async (k) => ({ key: k, value: (await Preferences.get({ key: k })).value }))
    );
    this.entries = pairs.sort((a, b) => a.key.localeCompare(b.key));
  }
}
