import type {PropTypeConfig_Compound} from '@theatre/core/propTypes'
import {isPropConfigComposite} from '@theatre/shared/propTypes/utils'
import type {$FixMe} from '@theatre/shared/utils/types'
import {getPointerParts} from '@theatre/dataverse'
import type {Pointer} from '@theatre/dataverse'
import last from 'lodash-es/last'
import {darken, transparentize} from 'polished'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {rowIndentationFormulaCSS} from '@theatre/studio/panels/DetailPanel/DeterminePropEditorForDetail/rowIndentationFormulaCSS'
import {propNameTextCSS} from '@theatre/studio/propEditors/utils/propNameTextCSS'
import {pointerEventsAutoInNormalMode} from '@theatre/studio/css'
import useRefAndState from '@theatre/studio/utils/useRefAndState'
import DeterminePropEditorForDetail from '@theatre/studio/panels/DetailPanel/DeterminePropEditorForDetail'
import type SheetObject from '@theatre/core/sheetObjects/SheetObject'

import useContextMenu from '@theatre/studio/uiComponents/simpleContextMenu/useContextMenu'
import {useEditingToolsForCompoundProp} from '@theatre/studio/propEditors/useEditingToolsForCompoundProp'
import type {PropHighlighted} from '@theatre/studio/panels/SequenceEditorPanel/whatPropIsHighlighted'
import {whatPropIsHighlighted} from '@theatre/studio/panels/SequenceEditorPanel/whatPropIsHighlighted'
import {deriver} from '@theatre/studio/utils/derive-utils'
import {getDetailRowHighlightBackground} from './getDetailRowHighlightBackground'

const Container = styled.div`
  --step: 15px;
  --left-pad: 15px;
  ${pointerEventsAutoInNormalMode};
`

const Header = deriver(styled.div<{isHighlighted: PropHighlighted}>`
  height: 30px;
  display: flex;
  align-items: stretch;
  position: relative;

  /* background-color: ${getDetailRowHighlightBackground}; */
`)

const Padding = styled.div`
  padding-left: ${rowIndentationFormulaCSS};
  display: flex;
  align-items: center;
`

const PropName = deriver(styled.div<{isHighlighted: PropHighlighted}>`
  margin-left: 4px;
  cursor: default;
  height: 100%;
  display: flex;
  align-items: center;
  user-select: none;
  &:hover {
    color: white;
  }

  ${() => propNameTextCSS};
`)

const color = transparentize(0.05, `#282b2f`)

const SubProps = styled.div<{depth: number; lastSubIsComposite: boolean}>`
  /* background: ${({depth}) => darken(depth * 0.03, color)}; */
  /* padding: ${(props) => (props.lastSubIsComposite ? 0 : '4px')} 0; */
`

export type ICompoundPropDetailEditorProps<
  TPropTypeConfig extends PropTypeConfig_Compound<any>,
> = {
  propConfig: TPropTypeConfig
  pointerToProp: Pointer<TPropTypeConfig['valueType']>
  obj: SheetObject
  visualIndentation: number
}

function DetailCompoundPropEditor<
  TPropTypeConfig extends PropTypeConfig_Compound<any>,
>({
  pointerToProp,
  obj,
  propConfig,
  visualIndentation,
}: ICompoundPropDetailEditorProps<TPropTypeConfig>) {
  const propName = propConfig.label ?? last(getPointerParts(pointerToProp).path)

  const allSubs = Object.entries(propConfig.props)
  const compositeSubs = allSubs.filter(([_, conf]) =>
    isPropConfigComposite(conf),
  )
  const nonCompositeSubs = allSubs.filter(
    ([_, conf]) => !isPropConfigComposite(conf),
  )

  const [propNameContainerRef, propNameContainer] =
    useRefAndState<HTMLDivElement | null>(null)

  const tools = useEditingToolsForCompoundProp(
    pointerToProp as $FixMe,
    obj,
    propConfig,
  )

  const [contextMenu] = useContextMenu(propNameContainer, {
    menuItems: tools.contextMenuItems,
  })

  const lastSubPropIsComposite = compositeSubs.length > 0

  const isPropHighlightedD = useMemo(
    () =>
      whatPropIsHighlighted.getIsPropHighlightedD({
        ...obj.address,
        pathToProp: getPointerParts(pointerToProp).path,
      }),
    [pointerToProp],
  )

  return (
    <Container>
      {contextMenu}
      <Header
        isHighlighted={isPropHighlightedD}
        // @ts-ignore
        style={{'--depth': visualIndentation - 1}}
      >
        <Padding>
          {tools.controlIndicators}
          <PropName
            isHighlighted={isPropHighlightedD}
            ref={propNameContainerRef}
          >
            {propName || 'Props'}
          </PropName>
        </Padding>
      </Header>

      <SubProps
        // @ts-ignore
        style={{'--depth': visualIndentation}}
        depth={visualIndentation}
        lastSubIsComposite={lastSubPropIsComposite}
      >
        {[...nonCompositeSubs, ...compositeSubs].map(
          ([subPropKey, subPropConfig]) => {
            return (
              <DeterminePropEditorForDetail
                key={'prop-' + subPropKey}
                propConfig={subPropConfig}
                pointerToProp={pointerToProp[subPropKey] as Pointer<$FixMe>}
                obj={obj}
                visualIndentation={visualIndentation + 1}
              />
            )
          },
        )}
      </SubProps>
    </Container>
  )
}

export default React.memo(DetailCompoundPropEditor)
