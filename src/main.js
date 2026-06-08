import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// PrimeVue components we'll use
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ConfirmDialog from 'primevue/confirmdialog'
import ConfirmationService from 'primevue/confirmationservice'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import InputNumber from 'primevue/inputnumber'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import SelectButton from 'primevue/selectbutton'
import ToggleSwitch from 'primevue/toggleswitch'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Slider from 'primevue/slider'
import Password from 'primevue/password'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark'
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

// Register commonly used components
app.component('Button', Button)
app.component('Card', Card)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('Dropdown', Dropdown)
app.component('Tag', Tag)
app.component('Badge', Badge)
app.component('ProgressBar', ProgressBar)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Textarea', Textarea)
app.component('Checkbox', Checkbox)
app.component('Chip', Chip)
app.component('Avatar', Avatar)
app.component('Menu', Menu)
app.component('Menubar', Menubar)
app.component('Tabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)
app.component('Password', Password)
app.component('SelectButton', SelectButton)
app.component('ToggleSwitch', ToggleSwitch)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)
app.component('Slider', Slider)

// Initialize auth before app starts
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})
