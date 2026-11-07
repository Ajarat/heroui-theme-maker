import type {ReactNode} from "react";

import {Icon} from "@iconify/react";

import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Chip,
  Description,
  Dropdown,
  Input,
  Kbd,
  Label,
  Link,
  ListBox,
  Meter,
  Modal,
  Popover,
  ProgressBar,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Surface,
  Switch,
  Table,
  Tabs,
  TextArea,
  TextField,
  Toast,
  Tooltip,
  toast,
} from "@/components";

function Group({children, title}: {children: ReactNode; title: string}) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="ts-group-title">{title}</h3>
      {children}
    </section>
  );
}

const CheckboxRow = ({children, defaultSelected}: {children: ReactNode; defaultSelected?: boolean}) => (
  <Checkbox defaultSelected={defaultSelected}>
    <Checkbox.Content>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      {children}
    </Checkbox.Content>
  </Checkbox>
);

const SwitchRow = ({children, defaultSelected}: {children: ReactNode; defaultSelected?: boolean}) => (
  <Switch defaultSelected={defaultSelected}>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      {children}
    </Switch.Content>
  </Switch>
);

const RadioRow = ({children, value}: {children: ReactNode; value: string}) => (
  <Radio value={value}>
    <Radio.Content>
      <Radio.Control>
        <Radio.Indicator />
      </Radio.Control>
      {children}
    </Radio.Content>
  </Radio>
);

const ROWS = [
  {id: "1", name: "Ada Park", role: "Design lead", status: "Active", tone: "success"},
  {id: "2", name: "Sam Okoye", role: "Engineer", status: "Away", tone: "warning"},
  {id: "3", name: "Lee Moreau", role: "Researcher", status: "Offline", tone: "danger"},
] as const;

export function ComponentPreview() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-10 gap-y-12 p-10 text-foreground">
      <Toast.Provider placement="bottom end" />

      <Group title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="danger-soft">Danger soft</Button>
          <Button className="button--accent-2">Accent 2</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button isDisabled>Disabled</Button>
          <Button isIconOnly aria-label="Add" variant="secondary">
            <Icon icon="gravity-ui:plus" />
          </Button>
        </div>
        <ButtonGroup variant="secondary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </Group>

      <Group title="Form fields">
        <TextField name="email">
          <Label>Email</Label>
          <Input placeholder="you@example.com" />
          <Description>We only use this to sign you in.</Description>
        </TextField>
        <Select placeholder="Choose a plan">
          <Label>Plan</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {["Free", "Team", "Enterprise"].map((plan) => (
                <ListBox.Item id={plan} key={plan} textValue={plan}>
                  {plan}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <TextField name="notes">
          <Label>Notes</Label>
          <TextArea placeholder="Anything we should know?" />
        </TextField>
      </Group>

      <Group title="Selection">
        <div className="flex flex-col gap-3">
          <CheckboxRow defaultSelected>Email me a summary</CheckboxRow>
          <CheckboxRow>Share with my team</CheckboxRow>
          <SwitchRow defaultSelected>Notifications</SwitchRow>
          <SwitchRow>Weekly digest</SwitchRow>
        </div>
        <RadioGroup defaultValue="comfortable" name="density">
          <Label>Density</Label>
          <RadioRow value="comfortable">Comfortable</RadioRow>
          <RadioRow value="compact">Compact</RadioRow>
        </RadioGroup>
        <Slider defaultValue={40}>
          <Label>Volume</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </Group>

      <Group title="Surfaces">
        <Card>
          <Card.Header>
            <Card.Title>Project settings</Card.Title>
            <Card.Description>Cards pick up the surface color, radius and shadow.</Card.Description>
          </Card.Header>
          <Card.Footer className="flex gap-2">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="tertiary">
              Cancel
            </Button>
          </Card.Footer>
        </Card>
        <Surface className="p-5" variant="secondary">
          <p className="text-sm">Secondary surface with a nested</p>
          <Separator className="my-3" />
          <p className="text-sm text-muted">separator and muted text.</p>
          <Surface className="mt-3 p-3" variant="tertiary">
            <p className="text-sm">Tertiary surface nested inside it</p>
          </Surface>
        </Surface>
      </Group>

      <Group title="Feedback">
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>New version available</Alert.Title>
            <Alert.Description>Update to get the latest fixes.</Alert.Description>
          </Alert.Content>
        </Alert>
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Changes saved</Alert.Title>
          </Alert.Content>
        </Alert>
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Storage almost full</Alert.Title>
          </Alert.Content>
        </Alert>
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Payment failed</Alert.Title>
          </Alert.Content>
        </Alert>
        <ProgressBar value={60}>
          <Label>Uploading</Label>
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <Meter value={82}>
          <Label>Quota</Label>
          <Meter.Output />
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <Spinner />
          <Skeleton className="h-4 flex-1 rounded-lg" />
        </div>
      </Group>

      <Group title="Navigation">
        <Breadcrumbs>
          <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Projects</Breadcrumbs.Item>
          <Breadcrumbs.Item>Settings</Breadcrumbs.Item>
        </Breadcrumbs>
        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Sections">
              {["Overview", "Activity", "Billing"].map((tab) => (
                <Tabs.Tab id={tab} key={tab}>
                  {tab}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          {["Overview", "Activity", "Billing"].map((tab) => (
            <Tabs.Panel className="pt-3 text-sm" id={tab} key={tab}>
              {tab} panel
            </Tabs.Panel>
          ))}
        </Tabs>
        <Accordion>
          {["What does the radius change?", "Can I undo a change?"].map((title) => (
            <Accordion.Item key={title}>
              <Accordion.Heading>
                <Accordion.Trigger>
                  {title}
                  <Accordion.Indicator>
                    <Icon icon="gravity-ui:chevron-down" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>Everything here previews live until you press Update.</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        <Link href="#">
          A themed link
          <Link.Icon aria-hidden="true" />
        </Link>
      </Group>

      <Group title="Data">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Team members">
              <Table.Header>
                <Table.Column isRowHeader>Name</Table.Column>
                <Table.Column>Role</Table.Column>
                <Table.Column>Status</Table.Column>
              </Table.Header>
              <Table.Body>
                {ROWS.map((row) => (
                  <Table.Row id={row.id} key={row.id}>
                    <Table.Cell>{row.name}</Table.Cell>
                    <Table.Cell>{row.role}</Table.Cell>
                    <Table.Cell>
                      <Chip color={row.tone} size="sm">
                        {row.status}
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Default</Chip>
          <Chip color="accent">Accent</Chip>
          <Chip className="chip--accent-2">Accent 2</Chip>
          <Chip className="chip--accent-2" variant="primary">
            Accent 2 solid
          </Chip>
          <Chip color="success">Success</Chip>
          <Chip color="warning">Warning</Chip>
          <Chip color="danger">Danger</Chip>
        </div>
        <div className="flex items-center gap-4">
          <Avatar>
            <Avatar.Fallback>AP</Avatar.Fallback>
          </Avatar>
          <Avatar color="accent">
            <Avatar.Fallback>SO</Avatar.Fallback>
          </Avatar>
          <Badge.Anchor>
            <Avatar color="success">
              <Avatar.Fallback>LM</Avatar.Fallback>
            </Avatar>
            <Badge color="danger">3</Badge>
          </Badge.Anchor>
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </div>
      </Group>

      <Group title="Overlays">
        <div className="flex flex-wrap gap-2">
          <Modal>
            <Button variant="secondary">Modal</Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-[360px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Delete project?</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>This shows the overlay color, shadow, backdrop and radius.</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button slot="close" variant="danger">
                      Delete
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          <Dropdown>
            <Button aria-label="Menu" variant="secondary">
              Dropdown
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item id="rename" textValue="Rename">
                  <Label>Rename</Label>
                </Dropdown.Item>
                <Dropdown.Item id="duplicate" textValue="Duplicate">
                  <Label>Duplicate</Label>
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                  <Label>Delete</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Popover>
            <Button variant="secondary">Popover</Button>
            <Popover.Content>
              <Popover.Dialog>
                <Popover.Heading>Popover heading</Popover.Heading>
                <p>Floating content on the overlay color.</p>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          <Tooltip delay={0}>
            <Button variant="secondary">Tooltip</Button>
            <Tooltip.Content>
              <p>Tooltip content</p>
            </Tooltip.Content>
          </Tooltip>

          <Button variant="secondary" onPress={() => toast.success("Theme looks good")}>
            Toast
          </Button>
        </div>
      </Group>

      <Group title="Type">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Heading one</h1>
          <h2 className="text-xl font-semibold tracking-tight">Heading two</h2>
          <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-sm text-muted">Muted supporting text for captions and hints.</p>
          <code className="font-mono text-sm">const theme = "yours";</code>
        </div>
      </Group>
    </div>
  );
}
