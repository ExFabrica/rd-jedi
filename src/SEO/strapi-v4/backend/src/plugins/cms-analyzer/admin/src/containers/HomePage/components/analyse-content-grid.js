import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

//Layout
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
//Icons
import Pencil from '@strapi/icons/Pencil';
import Trash from '@strapi/icons/Trash';
import Earth from '@strapi/icons/Earth';
import Eye from '@strapi/icons/EyeStriked';
//Table
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography';
import { IconButton } from '@strapi/design-system/IconButton';
//Badge
import { Badge } from '@strapi/design-system/Badge';

export const AnalyseContentGrid = (props) => {
    const { formatMessage } = useIntl();
    const COL_COUNT = 5;

    return <Table colCount={COL_COUNT} rowCount={props.value.length}>
        <Thead>
            <Tr>
                <Th>
                    <Typography variant="sigma">Message</Typography>
                </Th>
                <Th>
                    <Typography variant="sigma">Level</Typography>
                </Th>
                <Th>
                    <Typography variant="sigma">Content</Typography>
                </Th>
            </Tr>
        </Thead>
        <Tbody>
            {props.value.map(entry => <Tr key={`${entry.message}_${entry.content}`}>
                <Td>
                    <Typography textColor="neutral800">{entry.message}</Typography>
                </Td>
                <Td>
                    {
                        entry.level === "warnings"
                            ? <Badge backgroundColor="danger500" textColor="neutral0" paddingLeft="5" paddingRight="5" paddingTop="2" paddingBottom="2">Low</Badge>
                            : <Badge backgroundColor="danger700" textColor="neutral0" paddingLeft="5" paddingRight="5" paddingTop="2" paddingBottom="2">High</Badge>
                    }
                </Td>
                <Td>
                    <Typography textColor="neutral800">{entry.content}</Typography>
                </Td>
                <Td>
                    <Flex>
                        <IconButton onClick={() => console.log('View')} label="View" noBorder icon={<Earth />} />
                        <Box paddingLeft={1}>
                            <IconButton onClick={() => console.log("Don't show again")} label="Don't show again" noBorder icon={<Eye />} />
                        </Box>
                        <Box paddingLeft={1}>
                            <IconButton onClick={() => console.log('edit')} label="Edit" noBorder icon={<Pencil />} />
                        </Box>
                        <Box paddingLeft={1}>
                            <IconButton onClick={() => console.log('delete')} label="Delete" noBorder icon={<Trash />} />
                        </Box>
                    </Flex>
                </Td>
            </Tr>)}
        </Tbody>
    </Table>
};

AnalyseContentGrid.defaultProps = {
    value: [],
};

AnalyseContentGrid.propTypes = {
    value: PropTypes.array,
};