import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.adapterspot.com';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Programmatic style: the label operation reads binary data from the input item,
// which declarative routing cannot do.
export class AdapterSpot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AdapterSpot',
		name: 'adapterSpot',
		icon: { light: 'file:adapterspot.svg', dark: 'file:adapterspot.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Read a power adapter label from a photo and find the power supply that fits, with the AdapterSpot API',
		defaults: {
			name: 'AdapterSpot',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'adapterSpotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Connector', value: 'connector' },
					{ name: 'Label', value: 'label' },
					{ name: 'Power Supply', value: 'powerSupply' },
				],
				default: 'label',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['label'] } },
				options: [
					{
						name: 'Read',
						value: 'read',
						description:
							'Read voltage, current, wattage, connector and polarity from a photo of a power adapter label',
						action: 'Read a power adapter label',
					},
				],
				default: 'read',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['powerSupply'] } },
				options: [
					{
						name: 'Find',
						value: 'find',
						description: 'Find the power supply that fits given voltage, current or power',
						action: 'Find a power supply',
					},
				],
				default: 'find',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['connector'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'List the connector types in the AdapterSpot connector library',
						action: 'Get many connectors',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: { show: { resource: ['label'], operation: ['read'] } },
				hint: 'The name of the input binary field containing the photo (JPEG, PNG or WebP, max ~3.7 MB)',
			},
			{
				displayName: 'Voltage (V)',
				name: 'voltage',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				displayOptions: { show: { resource: ['powerSupply'], operation: ['find'] } },
				description: 'Output voltage in volts. Give at least two of voltage, current and power.',
			},
			{
				displayName: 'Current (A)',
				name: 'current',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				displayOptions: { show: { resource: ['powerSupply'], operation: ['find'] } },
				description: 'Output current in amps',
			},
			{
				displayName: 'Power (W)',
				name: 'power',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				displayOptions: { show: { resource: ['powerSupply'], operation: ['find'] } },
				description: 'Output power in watts',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['powerSupply'], operation: ['find'] } },
				options: [
					{
						displayName: 'Connector',
						name: 'connector',
						type: 'options',
						default: 'b21',
						options: [
							{ name: '4-Pin DIN', value: 'din4' },
							{ name: '3.5 × 1.35 Mm Barrel', value: 'b35' },
							{ name: '5.5 × 2.1 Mm Barrel', value: 'b21' },
							{ name: '5.5 × 2.5 Mm Barrel', value: 'b25' },
						],
					},
					{
						displayName: 'Polarity',
						name: 'polarity',
						type: 'options',
						default: 'center_positive',
						options: [
							{ name: 'Center Positive', value: 'center_positive' },
							{ name: 'Center Negative', value: 'center_negative' },
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['label', 'powerSupply'] } },
				options: [
					{
						displayName: 'Language',
						name: 'lang',
						type: 'options',
						default: 'en',
						description: 'Language of the note and the product links',
						options: [
							{ name: 'Dutch', value: 'nl' },
							{ name: 'English', value: 'en' },
							{ name: 'French', value: 'fr' },
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			let request: IHttpRequestOptions;

			try {
				if (resource === 'label' && operation === 'read') {
					const field = this.getNodeParameter('binaryPropertyName', i) as string;
					const binary = this.helpers.assertBinaryData(i, field);
					const mimeType = (binary.mimeType || '').toLowerCase().replace('image/jpg', 'image/jpeg');
					if (!IMAGE_TYPES.includes(mimeType)) {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported file type "${binary.mimeType}". Use a JPEG, PNG or WebP photo.`,
							{ itemIndex: i },
						);
					}
					const buffer = await this.helpers.getBinaryDataBuffer(i, field);
					const options = this.getNodeParameter('options', i, {}) as IDataObject;
					request = {
						method: 'POST',
						url: `${BASE_URL}/v1/label`,
						body: { image: buffer.toString('base64'), media_type: mimeType, lang: options.lang ?? 'en' },
						json: true,
					};
				} else if (resource === 'powerSupply' && operation === 'find') {
					const qs: IDataObject = {};
					for (const name of ['voltage', 'current', 'power']) {
						const value = this.getNodeParameter(name, i, 0) as number;
						if (value > 0) qs[name] = value;
					}
					if (Object.keys(qs).length < 2) {
						throw new NodeOperationError(
							this.getNode(),
							'Give at least two of voltage, current and power.',
							{ itemIndex: i },
						);
					}
					Object.assign(qs, this.getNodeParameter('additionalFields', i, {}) as IDataObject);
					const options = this.getNodeParameter('options', i, {}) as IDataObject;
					if (options.lang) qs.lang = options.lang;
					request = { method: 'GET', url: `${BASE_URL}/v1/power-supply`, qs, json: true };
				} else if (resource === 'connector' && operation === 'getAll') {
					request = { method: 'GET', url: `${BASE_URL}/v1/connectors`, json: true };
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported operation "${operation}" for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				let response: IDataObject;
				try {
					response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'adapterSpotApi',
						request,
					)) as IDataObject;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
				}

				if (resource === 'connector') {
					for (const connector of (response.connectors as IDataObject[]) ?? []) {
						returnData.push({ json: connector, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: response, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				// Keep NodeApiError/NodeOperationError as thrown above; wrap anything else.
				const nodeError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				throw nodeError;
			}
		}

		return [returnData];
	}
}
