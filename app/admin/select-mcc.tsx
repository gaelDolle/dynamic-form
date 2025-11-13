import { createListCollection, Select, Span, Stack } from "@chakra-ui/react";

export interface MCCOption {
  label: string;
  value: string;
}

export const MCC_OPTIONS: MCCOption[] = [
  { label: "Épiceries/Supermarchés", value: "5411" },
  { label: "Restaurants, Lieux de restauration", value: "5812" },
  {
    label: "Transport de passagers local/banlieue",
    value: "4111",
  },
  {
    label: "Magasins de détail divers et spécialisés",
    value: "5999",
  },
  {
    label: "Services de transport (non classés ailleurs)",
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
      cursor="pointer"
    >
      <Select.HiddenSelect />
      <Select.Label />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Sélectionnez un MCC" />
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
              <Stack
                direction="row"
                gap={1}
                wrap="wrap"
                alignItems="center"
                p={1}
              >
                <Select.ItemText>{option.value}</Select.ItemText>
                <Span color="fg.muted" textStyle="xs">
                  - {option.label}
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
