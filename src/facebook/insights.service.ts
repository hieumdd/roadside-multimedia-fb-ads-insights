import { Readable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import axios from 'axios';

import { getClient } from './api.service';

export type ReportOptions = {
    accountId: string;
    start: string;
    end: string;
};

export type InsightsConfig = {
    level: string;
    fields: string[];
    breakdowns?: string;
};

export const get = async (options: ReportOptions, config: InsightsConfig): Promise<Readable> => {
    const client = await getClient();

    const requestReport = async (): Promise<string> => {
        type RequestReportResponse = {
            report_run_id: string;
        };

        const { accountId, start: since, end: until } = options;
        const { level, fields, breakdowns } = config;

        return client
            .request<RequestReportResponse>({
                method: 'POST',
                url: `/act_${accountId}/insights`,
                data: {
                    level,
                    fields,
                    breakdowns,
                    time_range: JSON.stringify({ since, until }),
                    time_increment: 1,
                },
            })
            .then(({ data }) => data.report_run_id);
    };

    const pollReport = async (reportId: string): Promise<string> => {
        type ReportStatusResponse = {
            async_percent_completion: number;
            async_status: string;
        };

        const data = await client
            .request<ReportStatusResponse>({ method: 'GET', url: `/${reportId}` })
            .then((response) => response.data);

        if (data.async_percent_completion === 100 && data.async_status === 'Job Completed') {
            return reportId;
        }

        if (data.async_status === 'Job Failed') {
            throw new Error(JSON.stringify(data));
        }

        await setTimeout(10_000);

        return pollReport(reportId);
    };

    const getInsights = (reportId: string): Readable => {
        type InsightsResponse = {
            data: Record<string, any>[];
            paging: { cursors: { after: string }; next: string };
        };

        const stream = new Readable({ objectMode: true, read: () => {} });

        const _getInsights = (after?: string) => {
            client
                .request<InsightsResponse>({
                    method: 'GET',
                    url: `/${reportId}/insights`,
                    params: { after, limit: 500 },
                })
                .then((response) => response.data)
                .then(({ data, paging }) => {
                    data.forEach((row) => stream.push(row));
                    paging.next ? _getInsights(paging.cursors.after) : stream.push(null);
                })
                .catch((error) => {
                    if (axios.isAxiosError(error)) {
                        console.log(JSON.stringify(error.response?.data));
                    }
                    stream.emit('error', error);
                });
        };

        _getInsights();

        return stream;
    };

    return requestReport()
        .then(pollReport)
        .then(getInsights)
        .catch((error) => {
            if (axios.isAxiosError(error)) {
                console.log(JSON.stringify(error.response?.data));
            } else {
                console.log(error);
            }
            return Promise.reject(error);
        });
};
