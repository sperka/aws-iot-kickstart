import { Pipe, PipeTransform } from '@angular/core'
import { SystemBlueprint } from '@deathstar/sputnik-ui-angular/app/models/system-blueprint.model'
import { SystemBlueprintService } from '@deathstar/sputnik-ui-angular/app/services/system-blueprint.service'

@Pipe({ name: 'systemBlueprintFromSystemBlueprintId', pure: true })
export class SystemBlueprintFromSystemBlueprintIdPipe implements PipeTransform {
	constructor (private systemBlueprintService: SystemBlueprintService) {}

	transform (id: string): SystemBlueprint | null {
		const index = this.systemBlueprintService.systemBlueprints.findIndex((r: SystemBlueprint) => {
			return r.id === id
		})

		if (index !== -1) {
			return this.systemBlueprintService.systemBlueprints[index]
		} else {
			return null
		}
	}
}