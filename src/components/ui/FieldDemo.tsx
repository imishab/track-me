import { Button } from "@/src/components/ui/button"
import { Checkbox } from "@/src/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Textarea } from "@/src/components/ui/textarea"

export function FieldDemo() {
  return (
    <div className="w-full max-w-full">
      <form>
        <FieldGroup>
          <FieldSet>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                  Habit Title
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-name-43j"
                  placeholder="Book Reading"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-exp-month-ts6">
                  Tracking Type
                </FieldLabel>
                <Select defaultValue="">
                  <SelectTrigger id="checkout-exp-month-ts6">
                    <SelectValue placeholder="Select Tracking Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="01">Check box</SelectItem>
                      <SelectItem value="02">Numeric Counter</SelectItem>
                      <SelectItem value="03">Time Duration</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>

        </FieldGroup>
      </form>
    </div>
  )
}
