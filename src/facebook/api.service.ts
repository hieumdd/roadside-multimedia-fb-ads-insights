import axios from 'axios';

type DopplerSecretResponse = { value: { raw: string } };

export const getClient = async () => {
    const API_VER = 'v16.0';

    const accessToken = await axios
        .request<DopplerSecretResponse>({
            method: 'GET',
            url: 'https://api.doppler.com/v3/configs/config/secret',
            params: { project: 'eaglytics', config: 'prd', name: 'FACEBOOK_ACCESS_TOKEN' },
            auth: { username: process.env.DOPPLER_TOKEN || '', password: '' },
        })
        .then(({ data }) => data.value.raw);

    return axios.create({
        baseURL: `https://graph.facebook.com/${API_VER}`,
        params: { access_token: accessToken },
    });
};
