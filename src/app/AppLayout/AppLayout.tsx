import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Button,
  Masthead,
  MastheadBrand,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  PageSidebarBody,
  SkipToContent,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { useNavigationData, isNavDataGroup, NavDataItem, NavDataHref, NavDataGroup } from '@app/navData';
import { ChatBot } from '@app/ChatBot/ChatBot';

interface IAppLayout {
  children: React.ReactNode;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <Button
            icon={<BarsIcon />}
            variant="plain"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Global navigation"
          />
        </MastheadToggle>
        <MastheadBrand data-codemods>
          <MastheadLogo data-codemods>
            <svg height="40px" viewBox="0 0 64.377394 13.229167" style={{ height: '40px', width: 'auto' }}>
              <title>Open Data Hub</title>
              <g transform="translate(-1.3561905e-7,-283.77084)">
                <g transform="matrix(4.0724844,0,0,4.0724844,-430.01386,195.33008)">
                  <g style={{ fill: '#000000', fillOpacity: 1 }}>
                    <text x="111" y="23.5" style={{ fontSize: '1.27px', fontFamily: 'Montserrat', fontWeight: 600, fill: '#000000' }}>
                      OPEN DATA HUB
                    </text>
                  </g>
                </g>
                <g transform="matrix(0.41804463,0,0,0.41804463,30.288015,265.18107)">
                  <path
                    style={{ fill: '#a586f3', fillOpacity: 1 }}
                    d="m -47.422096,44.468683 c -0.596795,0.008 -1.073079,0.50032 -1.062425,1.09706 v 20.316888 c -0.0538,0.62942 0.442264,1.17021 1.073972,1.17021 0.631733,0 1.171601,-0.54077 1.117519,-1.17021 v -4.787507 l 0.02602,-0.37829 c 0,-3.397267 2.723212,-6.132027 6.120478,-6.132027 3.39726,0 6.132025,2.73476 6.132025,6.132027 6.15e-4,0.0112 9.22e-4,0.0225 0.0017,0.0337 -0.0016,0.0272 -0.0022,0.0544 -0.0017,0.0815 v 6.774867 c 0,0.59632 0.483415,1.079737 1.079737,1.079737 0.596334,0 1.079749,-0.483407 1.079749,-1.079737 v -6.774867 c 0,-0.0201 -7.4e-4,-0.0402 -0.0019,-0.0599 0.0011,-0.0183 0.0018,-0.0373 0.0019,-0.0556 5e-6,-4.562257 -3.729254,-8.279957 -8.291511,-8.279957 -2.458522,0 -4.671362,1.07999 -6.189762,2.78958 v -9.660674 c 0.01064,-0.60577 -0.479689,-1.10143 -1.085519,-1.09707 z"
                  />
                  <path
                    style={{ fill: '#5ed3ee', fillOpacity: 1 }}
                    d="m -50.373419,44.526303 c -0.0023,3e-5 -0.0047,0 -0.0071,0 -0.596792,0.008 -1.073077,0.50031 -1.062422,1.09707 v 15.093431 c 0,2.582657 -1.60233,4.882037 -4.030276,5.762487 -2.427945,0.88045 -5.146397,0.14622 -6.801811,-1.83614 -1.655408,-1.982357 -1.888211,-4.777627 -0.588952,-7.009674 1.299266,-2.23205 3.844811,-3.40528 6.386081,-2.94476 0.586168,0.10715 1.14842,-0.28052 1.256695,-0.86648 0.108275,-0.58596 -0.278305,-1.14896 -0.86406,-1.25836 -3.426567,-0.620947 -6.88606,0.97446 -8.637954,3.98408 -1.751894,3.009617 -1.43528,6.808004 0.796816,9.480954 2.232103,2.672947 5.906944,3.658457 9.180713,2.471287 2.757168,-0.999827 4.744168,-3.366367 5.302731,-6.168584 0,0 0.122022,-0.2937 0.159505,-0.56393 0.03748,-0.27024 0,-1.05088 0,-1.05088 V 45.623493 c 0.01089,-0.60758 -0.482327,-1.10408 -1.089971,-1.09719 z"
                  />
                  <g transform="matrix(5.9126081,0,0,5.9126081,-528.6668,56.376298)">
                    <circle
                      style={{ fill: 'none', stroke: '#a6d03f', strokeWidth: 0.36458334, strokeOpacity: 1 }}
                      cx="79.677254"
                      cy="0.71328706"
                      r="0.64509356"
                    />
                    <path
                      d="m 80.808656,2.1246589 a 1.8088735,1.8088735 0 0 1 -2.309183,-0.038478 1.8088735,1.8088735 0 0 1 -0.389241,-2.2764655 1.8088735,1.8088735 0 0 1 2.165211,-0.80353224"
                      style={{ fill: 'none', stroke: '#536a1c', strokeWidth: 0.36458334, strokeLinecap: 'round', strokeOpacity: 1 }}
                    />
                    <path
                      d="m 82.216272,1.1390005 a 2.455857,2.4425189 0 0 1 -2.468226,2.016391 2.455857,2.4425189 0 0 1 -2.383743,-2.114547 2.455857,2.4425189 0 0 1 1.733108,-2.6684936"
                      style={{ fill: 'none', stroke: '#2e3e05', strokeWidth: 0.36458337, strokeLinecap: 'round', strokeOpacity: 1 }}
                    />
                  </g>
                </g>
              </g>
            </svg>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );

  const location = useLocation();
  const navigationData = useNavigationData();

  const renderNavItem = (item: NavDataHref) => (
    <NavItem key={item.id} id={item.id} isActive={item.href === location.pathname}>
      <NavLink to={item.href}>{item.label}</NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: NavDataGroup) => {
    const isActive = group.children.some((child) => child.href === location.pathname);
    return (
      <NavExpandable key={group.id} id={group.id} title={group.group.title} isActive={isActive}>
        {group.children.map((child) => renderNavItem(child))}
      </NavExpandable>
    );
  };

  const Navigation = (
    <Nav id="nav-primary-simple" theme="dark">
      <NavList id="nav-list-simple">
        {navigationData.map((item) => (isNavDataGroup(item) ? renderNavGroup(item) : renderNavItem(item)))}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar theme="dark">
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';

  const PageSkipToContent = (
    <SkipToContent
      onClick={(event) => {
        event.preventDefault();
        const primaryContentContainer = document.getElementById(pageId);
        primaryContentContainer?.focus();
      }}
      href={`#${pageId}`}
    >
      Skip to Content
    </SkipToContent>
  );
  return (
    <Page
      mainContainerId={pageId}
      masthead={masthead}
      sidebar={sidebarOpen && Sidebar}
      skipToContent={PageSkipToContent}
    >
      {children}
      <ChatBot />
    </Page>
  );
};

export { AppLayout };
