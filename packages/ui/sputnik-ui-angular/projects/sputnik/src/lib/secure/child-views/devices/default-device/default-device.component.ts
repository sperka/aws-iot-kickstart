import { Component, Input, OnInit } from '@angular/core'
import { Observable, Subject } from 'rxjs'
// Components
import { IoTPubSuberComponent } from '../../../common/iot-pubsuber.component'
// Models
import { Device } from '../../../../models/device.model'
import { DeviceBlueprint } from '../../../../models/device-blueprint.model'
// Services
import { IoTService } from '../../../../services/iot.service'
import { AppSyncService } from '../../../../services/appsync.service'

@Component({
	selector: 'app-default-device',
	template: `
				<app-widgets *ngIf="widgets" [widgets]="widgets" [parent]="parent" [device]="device"></app-widgets>
		`,
})
export class DefaultDeviceComponent extends IoTPubSuberComponent implements OnInit {
		@Input() device: Device = new Device();

		private widgetSubscriptionSubjects: any = {};

		public widgetSubscriptionObservable$: any = {};

		constructor (private iotService: IoTService, private appSyncService: AppSyncService) {
			super(iotService)
		}

		public widgets: any[];

		public parent: any;

		async ngOnInit () {
			const { device } = this

			try {
				const deviceBlueprint: DeviceBlueprint = await this.appSyncService.getDeviceBlueprint(device.deviceBlueprintId)

				if (deviceBlueprint?.spec?.View != null) {
					this.parent = this // What does this do? From old code, but seems odd

					const widgetSubscriptions = []
					const view = JSON.parse(
						JSON.stringify(deviceBlueprint.spec.View)
						.split('[CORE]')
						.join(device.thingName)
						.split('[THING_NAME]')
						.join(device.thingName)
						.split('[DEVICE_NAME]')
						.join(device.name),
					)

					let initShadow = false
					try {
						if (view.subscriptions) {
							const subs = view.subscriptions
							for (const ref in subs) {
								if (subs[ref]) {
									const topic = subs[ref]

									if(topic.search(/\$aws\/things\/.*\/shadow/g) > -1) {
										initShadow = true
									}

									this.widgetSubscriptionSubjects[ref] = new Subject<any>()
									this.widgetSubscriptionObservable$[ref] = this.widgetSubscriptionSubjects[ref].asObservable()

									widgetSubscriptions.push({
										topic: topic,
										onMessage: message => {
											// console.log('onMessage:', topic, message);
											this.widgetSubscriptionSubjects[ref].next(message.value)
										},
										onError: (error) => console.error(`WidgetSubscription:Error:${device.thingName}:topic/${topic}`, error),
									})
								}
							}

							this.subscribe(widgetSubscriptions)
						}
					} catch (error) {
						console.error(`Failed to subscribe to subscriptions on device "${device.thingName}"`, error)
					}

					if(initShadow) {
						try {
							this.shadow = await this.iotService.getThingShadow({ thingName: device.thingName })
						} catch (error) {
							console.error(`Failed to get shadow for thingName "${device.thingName}"`, error)
						}
					}

					if (view.widgets) {
						this.widgets = view.widgets
					}
				}
			} catch (error) {
				console.error('Failed to initialize device.', device, error)
			}
		}
}