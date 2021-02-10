import React from "react";
import {base} from "@airtable/blocks";
import {Box, Text, Select} from "@airtable/blocks/ui";
import {selectAllowedTypes} from './utils';


function CustomFieldPicker({docupilot_field_name, table, onSelection, allowed_field_types=null, updateLinkedTable=null, width="50%"}) {

    if (!table) {
        return <Select width={width} disabled={true} value={null} options={[{value: null, label: '-'}]}/>
    }

    const field_options = allowed_field_types ? table.fields.filter(airtable_field => allowed_field_types.includes(airtable_field.type)) : table.fields;
    const [selected_field, setSelectedField] = React.useState(field_options.filter(airtable_field => airtable_field.name == docupilot_field_name)[0]);
    const options = [{value: null, label: '-'}, ...field_options.map(airtable_field => ({value: airtable_field.id, label: airtable_field.name}))];

    onSelection(selected_field? selected_field.id: null);
    if (updateLinkedTable != null) {
        updateLinkedTable(selected_field? base.getTableById(selected_field.options.linkedTableId as string): null);
    }

    return <Select width={width} value={selected_field ? selected_field.id : null} options={options}
                   onChange={(newValue => {
                       let newField = newValue ? table.getFieldById(newValue) : null;
                       setSelectedField(newField);
                   })}/>
}

function MappingComponent({docupilot_field, table, cb, indentation=0}) {
    const [linked_table, setLinkedTable] = React.useState(null);
    const has_child = docupilot_field.fields != null;
    let field_mapping = new Map<string, any>(
        [
            ['__airtable_field__', null],
            ['__docupilot_type__', docupilot_field.type]
        ]
    );

    let main_component = (
        <Box display="flex" paddingY="8px">
            <Text paddingLeft={`${indentation}px`} width="50%" size="large">{docupilot_field.name}</Text>
            <CustomFieldPicker docupilot_field_name={docupilot_field.name} table={table}
                               onSelection={(newValue) => {
                                   field_mapping.set('__airtable_field__', newValue);
                                   cb(field_mapping);
                               }}
                               allowed_field_types={selectAllowedTypes(docupilot_field)}
                               updateLinkedTable={has_child? setLinkedTable: null}/>
        </Box>
    );
    let child_components;
    if (has_child) {
        child_components = docupilot_field.fields.map(child_field => {
            return <MappingComponent docupilot_field={child_field} table={linked_table} indentation={indentation+10}
                                     cb={(newValue) => {
                                         field_mapping.set(child_field.name, newValue);
                                         cb(field_mapping);
                                     }}/>;
        })
    }
    return (
        <Box borderLeft={indentation != 0? '1px solid #E5E5E5': null}>
            {main_component}
            {child_components}
        </Box>
    );
}

export function SchemaComponent({schema, activeTable, updateMapping}) {

    const mapping_components = schema.map(docupilot_field => {
        return <MappingComponent docupilot_field={docupilot_field} table={activeTable}
                                 cb={(newValue) => updateMapping(docupilot_field.name, newValue)}
        />
    });

    return (
        <Box marginX="12px" marginY="24px">
            <Box display="flex" paddingY="16px">
                <Text width="50%" size="large" textColor="light">Docupilot fields</Text>
                <Text width="50%" size="large" textColor="light">Airtable fieds/columns</Text>
            </Box>
            <Box>
                {mapping_components}
            </Box>
        </Box>
    );
}