import { useCursor, useLoadable, useWatchable } from '@airtable/blocks/ui';
import { Record } from '@airtable/blocks/models';
import { RecordId } from '@airtable/blocks/types';
import { docupilot_to_airtable_field_mapping } from './constants';
import { globalConfig } from '@airtable/blocks';
import { generateDocument } from './apicallouts';

export function useSelectedRecordIds(): Array<RecordId> {
  const cursor = useCursor();
  // load selected records
  useLoadable(cursor);
  // re-render whenever the list of selected records changes
  useWatchable(cursor, ['selectedRecordIds']);
  // render the list of selected record ids
  return cursor.selectedRecordIds;
}

async function mergeData(
  key: string,
  mappingValue: DocupilotAirtable.MappingValue,
  record: Record,
) {
  const airtable_field = mappingValue.af;
  const docupilot_type = mappingValue.dt;

  if (airtable_field == null || airtable_field == '-') {
    return null;
  } else if (docupilot_type == 'string') {
    return record.getCellValueAsString(airtable_field);
  }

  if (mappingValue.fs != null) {
    const data_list = [];
    const linked_query_result = await record.selectLinkedRecordsFromCellAsync(
      airtable_field,
    );
    const linked_records =
      docupilot_type == 'object'
        ? linked_query_result.records.slice(0, 1)
        : linked_query_result.records;
    for (const linked_record of linked_records) {
      const data = {};
      for (const [key, value] of Object.entries(mappingValue.fs)) {
        const child_merged_data = await mergeData(key, value, linked_record);
        if (child_merged_data != null) {
          data[key] = child_merged_data;
        }
      }
      if (Object.keys(data).length != 0) {
        data_list.push(data);
      }
    }
    linked_query_result.unloadData();
    return docupilot_type == 'object'
      ? data_list[0]
      : data_list.length
      ? data_list
      : null;
  }

  console.warn(
    "getting cell value directly as it didn't match any known type",
    key,
    mappingValue,
    record,
  );
  return record.getCellValue(airtable_field);
}

export async function getMergedData(
  mapping: DocupilotAirtable.Mapping,
  record: Record,
) {
  const data = {};

  for (const [key, value] of Object.entries(mapping)) {
    const merged_data = await mergeData(key, value, record);
    if (merged_data != null) {
      data[key] = merged_data;
    }
  }
  return data;
}

export function selectAllowedTypes(
  schema_field: DocupilotAirtable.SchemaField,
): Array<string> {
  if (schema_field.type == 'array' && schema_field.generics != 'string') {
    return docupilot_to_airtable_field_mapping[schema_field.generics];
  }
  return docupilot_to_airtable_field_mapping[schema_field.type];
}

function getConfigPath(tableId: string, templateId: string, scope: string) {
  return [`table#${tableId}`, `template#${templateId.toString()}`, scope];
}

export function getMappedTemplates(tableId: string): number[] {
  return Object.keys(globalConfig.get([`table#${tableId}`]) ?? {}).map(
    (_) => +_.split('#')[1], // 'template#123' -> 123
  );
}

export function loadMapping(
  tableId: string,
  templateId: string,
): { mapping: DocupilotAirtable.Mapping; attachment_field_id: string } {
  const mapping = JSON.parse(
    (globalConfig.get(
      getConfigPath(tableId, templateId, 'mapping'),
    ) as string) || '{}',
  ) as DocupilotAirtable.Mapping;
  const attachment_field_id = globalConfig.get(
    getConfigPath(tableId, templateId, 'attach'),
  ) as string;
  return { mapping, attachment_field_id };
}

export function saveMapping(
  tableId: string,
  templateId: string,
  mapping: DocupilotAirtable.Mapping,
  attachment_field_id: string,
) {
  globalConfig
    .setPathsAsync([
      {
        path: getConfigPath(tableId, templateId, 'mapping'),
        value: JSON.stringify(mapping),
      },
      {
        path: getConfigPath(tableId, templateId, 'attach'),
        value: attachment_field_id,
      },
    ])
    .then(() => console.info('mapping saved'));
}

export async function executeDocumentGeneration({
  query,
  selectedRecordIds,
  attachment_field,
  mapping,
  selectedTemplate,
  onProgress,
}): Promise<{ [key: string]: DocupilotAirtable.GeneratedDocument }> {
  let generateDocuments = {};

  // splitting into to batches of 5 records
  let batches = [];
  while (selectedRecordIds.length) {
    batches.push(selectedRecordIds.splice(0, 5));
  }

  // iterating each batch
  for (let batch of batches) {
    const promises = batch.map(async (record_id) => {
      const record: Record = query.getRecordById(record_id);
      const merged_data = await getMergedData(mapping, record);
      const response = await generateDocument(
        selectedTemplate.id,
        merged_data,
        !!attachment_field,
      );
      generateDocuments[record.id] = {
        record_name: record.name,
        file_name: response.data.file_name,
        url: attachment_field ? response.data.file_url : null,
      };
      onProgress(Object.keys(generateDocuments).length);
    });
    // waiting for batch to finish
    await Promise.all(promises);
  }
  return generateDocuments;
}
