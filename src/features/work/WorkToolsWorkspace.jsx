import { BilingualEmailGenerator } from './BilingualEmailGenerator'
import { ExcelFormulaConverter } from './ExcelFormulaConverter'

export function WorkToolsWorkspace() {
  return (
    <div className="space-y-3">
      <ExcelFormulaConverter />
      <BilingualEmailGenerator />
    </div>
  )
}
