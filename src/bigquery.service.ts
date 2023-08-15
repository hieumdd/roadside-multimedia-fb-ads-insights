import { BigQuery } from '@google-cloud/bigquery';

const client = new BigQuery();

const DATASET = 'Facebook_dev';

type CreateLoadStreamOptions = {
    table: string;
    schema: Record<string, any>[];
    writeDisposition: 'WRITE_APPEND' | 'WRITE_TRUNCATE';
};

export const createLoadStream = (options: CreateLoadStreamOptions) => {
    return client
        .dataset(DATASET)
        .table(options.table)
        .createWriteStream({
            schema: { fields: options.schema },
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            createDisposition: 'CREATE_IF_NEEDED',
            writeDisposition: options.writeDisposition,
        });
};
