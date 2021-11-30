import React from 'react';
import styled from 'styled-components';

const StyleStrapiZoneMarker = styled.div`
  border: 1px solid red;
  padding:5px;
  font-weight: bolder;
  margin-top:10px;
  margin-bottom:10px;
`;

export const StrapiZoneMarker = () => {
    return <StyleStrapiZoneMarker>
        Injection Zone
    </StyleStrapiZoneMarker>
}