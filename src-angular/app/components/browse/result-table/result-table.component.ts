import { Component, EventEmitter, HostBinding, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core'

import { sortBy } from 'lodash'
import { SettingsService } from 'src-angular/app/core/services/settings.service'
import { ChartData } from 'src-shared/interfaces/search.interface'

import { CheckboxDirective } from '../../../core/directives/checkbox.directive'
import { SearchService } from '../../../core/services/search.service'
import { SelectionService } from '../../../core/services/selection.service'
import { ResultTableRowComponent } from './result-table-row/result-table-row.component'

@Component({
	selector: 'app-result-table',
	templateUrl: './result-table.component.html',
})
export class ResultTableComponent implements OnInit {
	@HostBinding('class.contents') contents = true

	@Output() rowClicked = new EventEmitter<ChartData[]>()

	@ViewChild(CheckboxDirective, { static: true }) checkboxColumn: CheckboxDirective
	@ViewChildren('tableRow') tableRows: QueryList<ResultTableRowComponent>

	activeSong: ChartData[] | null = null
	sortDirection: 'ascending' | 'descending' = 'ascending'
	sortColumn: 'name' | 'artist' | 'album' | 'genre' | 'year' | null = null

	constructor(
		public searchService: SearchService,
		private selectionService: SelectionService,
		public settingsService: SettingsService
	) { }

	ngOnInit() {
		this.searchService.searchUpdated.subscribe(() => {
			this.activeSong = null
			this.updateSort()
		})
	}

	get songs() {
		return this.searchService.groupedSongs
	}

	onRowClicked(song: ChartData[]) {
		if (this.activeSong !== song) {
			this.activeSong = song
			this.rowClicked.emit(song)
		}
	}

	onColClicked(column: 'name' | 'artist' | 'album' | 'genre' | 'year') {
		if (this.songs.length === 0) { return }
		if (this.sortColumn !== column) {
			this.sortColumn = column
			this.sortDirection = 'ascending'
		} else if (this.sortDirection === 'descending') {
			this.sortDirection = 'ascending'
		} else {
			this.sortDirection = 'descending'
		}
		this.updateSort()
	}

	private updateSort() {
		const col = this.sortColumn
		if (col !== null) {
			const groupedSongs = sortBy(this.searchService.groupedSongs, song => song[0][col])
			if (this.sortDirection === 'descending') { groupedSongs.reverse() }
			this.searchService.groupedSongs = groupedSongs
		}
	}

	/**
	 * Called when the user checks the `checkboxColumn`.
	 */
	checkAll(isChecked: boolean) {
		console.log(isChecked)
		if (isChecked) {
			this.selectionService.selectAll()
		} else {
			this.selectionService.deselectAll()
		}
	}

	tableScrolled(event: Event): void {
		if (event.target instanceof HTMLElement) {
			if (event.target.scrollHeight - (event.target.scrollTop + event.target.clientHeight) < 100) {
				// Scrolled near the bottom of the table
				if (this.searchService.areMorePages && !this.searchService.searchLoading) {
					this.searchService.search(this.searchService.searchControl.value || '*', true).subscribe()
				}
			}
		}
	}
}
