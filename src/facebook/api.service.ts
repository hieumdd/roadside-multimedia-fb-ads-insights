import axios from 'axios';
import qs from 'query-string';

export const getClient = async () => {
    const accessToken = await axios
        .request<{ value: { raw: string } }>({
            method: 'GET',
            url: 'https://api.doppler.com/v3/configs/config/secret',
            params: { project: 'facebook', config: 'master', name: 'USER_ACCESS_TOKEN' },
            auth: { username: process.env.DOPPLER_TOKEN ?? '', password: '' },
        })
        .then(({ data }) => data.value.raw);

    const apiVersion = 'v19.0';

    return axios.create({
        baseURL: `https://graph.facebook.com/${apiVersion}`,
        params: { access_token: accessToken },
        paramsSerializer: { serialize: (value) => qs.stringify(value, { arrayFormat: 'comma' }) },
    });
};
