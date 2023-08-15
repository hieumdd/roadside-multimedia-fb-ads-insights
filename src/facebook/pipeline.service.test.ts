import * as pipelines from './pipeline.const';
import { createPipelineTasks, runPipeline } from './pipeline.service';

it('pipeline', async () => {
    return runPipeline(
        {
            accountId: '753097179335560',
            start: '2023-01-01',
            end: '2023-02-01',
        },
        pipelines.ADS_INSIGHTS,
    )
        .then((results) => expect(results).toBeDefined())
        .catch((error) => {
            console.error({ error });
            return Promise.reject(error);
        });
});

it('create-tasks', async () => {
    return createPipelineTasks({
        start: '2023-08-01',
        end: '2023-09-01',
    })
        .then((result) => expect(result).toBeDefined())
        .catch((error) => {
            console.error({ error });
            return Promise.reject(error);
        });
});
