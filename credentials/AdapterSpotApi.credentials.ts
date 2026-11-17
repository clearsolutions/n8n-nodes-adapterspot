import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AdapterSpotApi implements ICredentialType {
	name = 'adapterSpotApi';

	displayName = 'AdapterSpot API';

	icon: Icon = {
		light: 'file:../nodes/AdapterSpot/adapterspot.svg',
		dark: 'file:../nodes/AdapterSpot/adapterspot.dark.svg',
	};

	documentationUrl = 'https://adapterspot.com/en/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Get a free key at https://adapterspot.com/en/api/',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.adapterspot.com',
			url: '/v1/usage',
			method: 'GET',
		},
	};
}
