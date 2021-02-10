import React from 'react';
import { RecordId } from '@airtable/blocks/types';
import { getSelectedRecordIds } from './utils';
import { getTemplates } from './apicallouts';
import { TemplateComponent } from './templates';
import { InformationComponent, LoaderComponent } from './common';
import { Box, Icon, Text } from '@airtable/blocks/ui';

export function MainComponent() {
  const [route, setRoute] = React.useState<string>('template-view');
  const [page_context, setPageContext] = React.useState<any>(null);
  const [templates, setTemplates] = React.useState<Docupilot.TemplateList>(
    null,
  );
  const [
    selected_template,
    setSelectedTemplate,
  ] = React.useState<Docupilot.Template>(null);
  const selected_record_ids: Array<RecordId> = getSelectedRecordIds();

  function refreshTemplates() {
    getTemplates().then((response) => {
      if (response) {
        setTemplates(response.data);
      }
    });
  }

  if (templates == null) {
    refreshTemplates();
  }

  if (route == 'template-view') {
    if (!selected_record_ids.length) {
      return (
        <InformationComponent
          image_icon="select-record"
          content="Select records to generate documents with docupilot"
        />
      );
    }
    if (templates) {
      return (
        <TemplateComponent
          templates={templates}
          refreshTemplates={refreshTemplates}
          selected_template={selected_template}
          selectTemplate={setSelectedTemplate}
          selected_record_ids={selected_record_ids}
          setRoute={setRoute}
          setPageContext={setPageContext}
        />
      );
    }
  } else if (route == 'merge-success') {
    let context_count = 0;
    let context: [{ record: string; generated_document: string }] =
      page_context || [];
    const merge_context = context.map((c) => (
      <Box
        key={context_count++}
        display="flex"
        borderBottom="1px solid #E5E5E5"
        paddingY="12px"
      >
        <Text flex="1" fontWeight="500" fontSize="14px" textColor="light">
          {c.record}
        </Text>
        <Box paddingX="12px" display="flex">
          <Icon name="file" size={20} marginX="6px" />
          <Text fontSize="12px" textColor="#B3B3B3">
            {c.generated_document}
          </Text>
        </Box>
      </Box>
    ));
    return (
      <InformationComponent
        image_icon="merge-success"
        content="Document created successfully 🎉"
        sub_content={merge_context}
        actions={[
          {
            label: 'Dismiss',
            textColor: 'light',
            onClick: () => {
              setSelectedTemplate(null);
              setRoute('template-view');
            },
          },
        ]}
      />
    );
  } else if (route == 'merge-fail') {
    return (
      <InformationComponent
        image_icon="merge-fail"
        content="Document creation failed ☹️"
        actions={[
          {
            label: 'Retry again',
            onClick: () => {
              setRoute('template-view');
            },
          },
          {
            label: 'Dismiss',
            variant: 'secondary',
            textColor: 'light',
            onClick: () => {
              setSelectedTemplate(null);
              setRoute('template-view');
            },
          },
        ]}
      />
    );
  }
  return <LoaderComponent />;
}
