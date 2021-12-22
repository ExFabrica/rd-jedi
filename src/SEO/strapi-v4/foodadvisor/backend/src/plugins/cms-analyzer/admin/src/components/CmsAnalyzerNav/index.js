import React from 'react';
import SeoIcon from '@strapi/icons/Book';
import MediaIcon from '@strapi/icons/Landscape';
import GreenIcon from '@strapi/icons/Earth';
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
      icon: <SeoIcon />,
      to: `/plugins/${pluginId}/seo`
    }, {
      id: 2,
      label: 'Media',
      icon: <MediaIcon/>,
      to: `/plugins/${pluginId}/media`
    }, {
      id: 3,
      label: 'Green CMS',
      icon: <GreenIcon />,
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
          {links.map(link => <SubNavLink to={link.to} active={link.active} key={link.id} icon={link.icon} >
              {link.label}
            </SubNavLink>)}
        </SubNavSections>
      </SubNav>
    </Box>
</Flex>;
}

export default AnalyzerNav;