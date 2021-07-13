import {
  Box,
  Button,
  Link,
  loadCSSFromString,
  Loader,
  Text,
  Tooltip,
} from '@airtable/blocks/ui';
import React from 'react';
import { ImageIcon } from './images';

loadCSSFromString(`
.generated-document:not(:last-child) {
    border-bottom: 1px solid #E5E5E5;
}
.generated-document:first-child {
    border-bottom: 1px solid #E5E5E5 !important;
}
`);

export function WrapperComponent({
  child_component,
  theme = 'light',
  padding = '48px',
}) {
  return (
    <Box
      backgroundColor={theme == 'light' ? 'white' : '#071C3F'}
      padding={padding}
      minHeight="100vh"
    >
      <Box marginY="12px">
        <ImageIcon
          name={theme == 'light' ? 'master-logo-blue' : 'master-logo-white'}
        />
      </Box>
      {child_component}
    </Box>
  );
}

export function InformationComponent({
  image_icon,
  content,
  sub_content = null,
  actions = [],
}) {
  let action_count: number = 0;
  const actionButtons = actions.map((action) => {
    return (
      <Button
        key={action_count++}
        width="100%"
        marginBottom="16px"
        variant={action.variant}
        onClick={action.onClick}
      >
        <Text fontWeight="500" fontSize="14px" textColor={action.textColor}>
          {' '}
          {action.label}{' '}
        </Text>
      </Button>
    );
  });
  return (
    <Box paddingX="24px" paddingY="4px" height="100vh">
      <Box
        backgroundColor="white"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minHeight={`calc(100% - 8px - ${48 * actionButtons.length}px)`}
      >
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box margin="16px">
            <ImageIcon name={image_icon} />
          </Box>
          <Text textColor="light" lineHeight="171%">
            {content}
          </Text>
        </Box>
        {sub_content && (
          <Box marginTop={'4px'} marginBottom={'4px'}>
            {sub_content}
          </Box>
        )}
      </Box>
      <div>{actionButtons}</div>
    </Box>
  );
}

export function LoaderComponent() {
  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Loader scale={0.3} fillColor="#888" />
    </Box>
  );
}

export function GeneratedDocumentRow({
  document,
}: {
  document: DocupilotAirtable.GeneratedDocument;
}) {
  return (
    <>
      <Box>
        <Text
          flex="1"
          fontWeight="500"
          fontSize="14px"
          display="flex"
          justifyContent="center"
          paddingTop="12px"
        >
          {document.record_name}
        </Text>
      </Box>
      <Box
        className="generated-document"
        display="flex"
        paddingY="12px"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          paddingX="12px"
          position="relative"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box>
            <ImageIcon name={document.file_name.split('.').pop()} />
          </Box>
          <Box
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          ></Box>
          <Box>
            <Tooltip
              content={document.file_name}
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
              shouldHideTooltipOnClick={true}
            >
              <p
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  width: '100px',
                  fontSize: '12px',
                  color: '#B3B3B3',
                }}
              >
                {document.file_name}
              </p>
            </Tooltip>
          </Box>
          {document.url ? (
            // @ts-ignore
            // ignoring as Link needs mandatory child, but Airtable link with icon inserts a child element
            <Link
              style={{
                paddingLeft: '4px',
              }}
              href={document.url}
              target="_blank"
              icon={<ImageIcon name="download" />}
              aria-label={`Download ${document.file_name}`}
            />
          ) : (
            <></>
          )}
        </Box>
      </Box>
    </>
  );
}
