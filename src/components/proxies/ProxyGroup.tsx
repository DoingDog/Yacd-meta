import * as React from 'react';
import { Zap } from 'react-feather';
import { useQuery } from 'react-query';

import { fetchVersion } from '$src/api/version';

import * as proxiesAPI from '$src/api/proxies';
import { getCollapsibleIsOpen, getHideUnavailableProxies, getProxySortBy } from '$src/store/app';
import { getProxies, switchProxy } from '$src/store/proxies';

import Button from '../Button';
import CollapsibleSectionHeader from '../CollapsibleSectionHeader';
import { connect, useStoreActions } from '../StateProvider';
import { useFilteredAndSorted } from './hooks';
import s0 from './ProxyGroup.module.scss';
import { ProxyList, ProxyListSummaryView } from './ProxyList';


const { createElement, useCallback, useMemo, useState } = React;


function ZapWrapper() {
  return (
    <div className={s0.zapWrapper}>
      <Zap size={16} />
    </div>
  );
}

function ProxyGroupImpl({
  name,
  all: allItems,
  delay,
  hideUnavailableProxies,
  proxySortBy,
  proxies,
  type,
  now,
  isOpen,
  apiConfig,
  dispatch,
}) {
  const all = useFilteredAndSorted(
    allItems,
    delay,
    hideUnavailableProxies,
    proxySortBy,
    proxies
  );

  const { data: version } = useQuery(['/version', apiConfig], () =>
    fetchVersion('/version',apiConfig)
  );

  const isSelectable = useMemo(() => ['Selector', version.meta && 'Fallback'].includes(type) , [type]);

  const {
    app: { updateCollapsibleIsOpen },
    // proxies: { requestDelayForProxyGroup },
  } = useStoreActions();

  const toggle = useCallback(() => {
    updateCollapsibleIsOpen('proxyGroup', name, !isOpen);
  }, [isOpen, updateCollapsibleIsOpen, name]);

  const itemOnTapCallback = useCallback(
    (proxyName) => {
      if (!isSelectable) return;
      dispatch(switchProxy(apiConfig, name, proxyName));
    },
    [apiConfig, dispatch, name, isSelectable]
  );
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const testLatency = useCallback(async () => {
    setIsTestingLatency(true);
    try {
      await proxiesAPI.requestDelayForProxyGroup(apiConfig,name);
    } catch (err) {}
    setIsTestingLatency(false);
  }, [apiConfig, name]);

  return (
    <div className={s0.group}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CollapsibleSectionHeader
          name={name}
          type={type}
          toggle={toggle}
          qty={all.length}
          isOpen={isOpen}
        />
        <Button
          title="Test latency"
          kind="minimal"
          onClick={testLatency}
          isLoading={isTestingLatency}
        >
          <ZapWrapper />
        </Button>
      </div>
      {createElement(isOpen ? ProxyList : ProxyListSummaryView, {
        all,
        now,
        isSelectable,
        itemOnTapCallback,
      })}
    </div>
  );
}

export const ProxyGroup = connect((s, { name, delay }) => {
  const proxies = getProxies(s);
  const collapsibleIsOpen = getCollapsibleIsOpen(s);
  const proxySortBy = getProxySortBy(s);
  const hideUnavailableProxies = getHideUnavailableProxies(s);

  const group = proxies[name];
  const { all, type, now } = group;
  return {
    all,
    delay,
    hideUnavailableProxies,
    proxySortBy,
    proxies,
    type,
    now,
    isOpen: collapsibleIsOpen[`proxyGroup:${name}`],
  };
})(ProxyGroupImpl);
