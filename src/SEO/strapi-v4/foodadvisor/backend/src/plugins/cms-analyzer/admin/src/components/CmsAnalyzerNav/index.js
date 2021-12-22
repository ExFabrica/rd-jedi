import React from 'react';
import Apps from '@strapi/icons/Apps';
import Plus from '@strapi/icons/Plus';
import Key from '@strapi/icons/Key';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Information from '@strapi/icons/Information';
import { MemoryRouter } from 'react-router-dom';
import {
  SubNav,
  SubNavHeader,
  SubNavSection,
  SubNavSections,
  SubNavLink,
  SubNavLinkSection,
} from '@strapi/design-system/SubNav';
import { Box } from '@strapi/design-system/Box';
import { Link } from '@strapi/design-system/Link';
import { Flex } from '@strapi/design-system/Flex';
import { TextButton } from '@strapi/design-system/TextButton';
import pluginId from '../../pluginId';

const AnalyzerNav = () => {
    const links = [{
      id: 1,
      label: 'SEO',
      icon: <ExclamationMarkCircle />,
      to: `/plugins/${pluginId}/seo`
    }, {
      id: 2,
      label: 'Media',
      to: `/plugins/${pluginId}/media`
    }, {
      id: 3,
      label: 'Green CMS',
      icon: <Apps />,
      to: `/plugins/${pluginId}/green`,
      active: true
    },
    ];

    const setSearch= () =>{ return "bob"}
    
    return <Flex>
    <Box padding={0} style={{height: '100vh'}}>
      <SubNav ariaLabel="Builder sub nav">
        <SubNavHeader label="CMS Analyzer"/>
        <SubNavSections>
          {/* <SubNavSection label="Collection Type" collapsable badgeLabel={links.length.toString()}> */}
            {links.map(link => <SubNavLink to={link.to} active={link.active} key={link.id}>
                {link.label}
              </SubNavLink>)}
          {/* </SubNavSection> */}
        </SubNavSections>
      </SubNav>
    </Box>
</Flex>;
}

export default AnalyzerNav;