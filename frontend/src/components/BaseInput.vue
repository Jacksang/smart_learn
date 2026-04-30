<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  error: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="base-input" :class="{ 'has-error': error }">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="input-wrapper">
      <span v-if="$slots.prepend" class="input-addon input-addon--prepend">
        <slot name="prepend" />
      </span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="input-field"
        :class="{ 'has-prepend': $slots.prepend, 'has-append': $slots.append }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="$slots.append" class="input-addon input-addon--append">
        <slot name="append" />
      </span>
    </div>
    <p v-if="error" class="input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.input-wrapper {
  display: flex;
  align-items: center;
}

.input-field {
  flex: 1;
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-gray-900);
  background: #fff;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field::placeholder {
  color: var(--color-gray-300);
}

.input-field:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.input-field:disabled {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.has-error .input-field {
  border-color: var(--color-danger);
}

.has-error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.has-prepend {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.has-append {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-addon {
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-300);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.input-addon--prepend {
  border-right: 0;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.input-addon--append {
  border-left: 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.input-error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>
