import axios from 'axios';
import qs from 'query-string';

const getSecret = async (name: string) => {
    return await axios
        .request<{ value: { raw: string } }>({
            method: 'GET',
            url: 'https://api.doppler.com/v3/configs/config/secret',
            params: { project: 'facebook', config: 'master', name },
            auth: { username: process.env.DOPPLER_TOKEN ?? '', password: '' },
        })
        .then(({ data }) => data.value.raw);
};

export const getClient = async () => {
    const [apiVersion, accessToken] = await Promise.all([
        getSecret('API_VERSION'),
        getSecret('USER_ACCESS_TOKEN'),
    ]);

    return axios.create({
        baseURL: `https://graph.facebook.com/${apiVersion}`,
        params: { access_token: accessToken },
        paramsSerializer: { serialize: (value) => qs.stringify(value, { arrayFormat: 'comma' }) },
    });
};
