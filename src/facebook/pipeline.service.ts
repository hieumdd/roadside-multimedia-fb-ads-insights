import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Joi from 'joi';
import ndjson from 'ndjson';

import { createLoadStream } from '../bigquery.service';
import { createTasks } from '../cloud-tasks.service';
import { getAccounts } from './account.service';
import { ReportOptions, get } from './insights.service';
import * as pipelines from './pipeline.const';

dayjs.extend(utc);

export const runPipeline = async (reportOptions: ReportOptions, pipeline_: pipelines.Pipeline) => {
    const stream = await get(reportOptions, pipeline_.insightsConfig);

    await pipeline(
        stream,
        new Transform({
            objectMode: true,
            transform: (row, _, callback) => {
                callback(null, {
                    ...Joi.attempt(row, pipeline_.validationSchema),
                    _batched_at: dayjs().toISOString(),
                });
            },
        }),
        ndjson.stringify(),
        createLoadStream({
            table: `p_${pipeline_.name}__${reportOptions.accountId}`,
            schema: [...pipeline_.schema, { name: '_batched_at', type: 'TIMESTAMP' }],
            writeDisposition: 'WRITE_APPEND',
        }),
    );

    return true;
};

export type CreatePipelineTasksOptions = {
    start?: string;
    end?: string;
};

export const createPipelineTasks = async ({ start, end }: CreatePipelineTasksOptions) => {
    const accounts = await getAccounts();

    return Promise.all([
        Object.keys(pipelines)
            .map((pipeline) => {
                return accounts.map(({ account_id }) => ({
                    accountId: account_id,
                    start,
                    end,
                    pipeline,
                }));
            })
            .map((data) => createTasks(data, (task) => [task.pipeline, task.accountId].join('-'))),
        pipeline(
            Readable.from(accounts),
            ndjson.stringify(),
            createLoadStream({
                table: `Accounts`,
                schema: [
                    { name: 'account_name', type: 'STRING' },
                    { name: 'account_id', type: 'INT64' },
                ],
                writeDisposition: 'WRITE_TRUNCATE',
            }),
        ),
    ]);
};
