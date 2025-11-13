import { createListCollection, Select, Span, Stack } from "@chakra-ui/react";

export interface MCCOption {
  label: string;
  value: string;
}

export const MCC_OPTIONS: MCCOption[] = [
  { label: "Grocery Stores/Supermarkets", value: "5411" },
  { label: "5812 - Eating Places, Restaurants", value: "5812" },
  {
    label: "Local/Suburban Commuter Passenger Transportation",
    value: "4111",
  },
  {
    label: "Miscellaneous and Specialty Retail Stores",
    value: "5999",
  },
  {
    label: "Transportation Services (Not Elsewhere Classified)",
    value: "4789",
  },
];

const SelectMCC = ({
  value,
  onChange,
}: {
  value: { value: string; label: string } | null | undefined;
  onChange: (value: string) => void;
}) => {
  return (
    <Select.Root
      collection={createListCollection({
        items: MCC_OPTIONS,
      })}
      value={value ? [value.value] : []}
      onValueChange={(e) => onChange(e.value[0] || "")}
    >
      <Select.HiddenSelect />
      <Select.Label />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select a MCC" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
          <Select.ClearTrigger />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {MCC_OPTIONS.map((option) => (
            <Select.Item key={option.value} item={option.value}>
              <Stack gap="0">
                <Select.ItemText>{option.value}</Select.ItemText>
                <Span color="fg.muted" textStyle="xs">
                  {option.label}
                </Span>
              </Stack>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
};

export default SelectMCC;
